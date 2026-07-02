from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from database import mongodb
from auth import get_current_user
from uuid import uuid4

router = APIRouter()

class TeamWorkspaceCreate(BaseModel):
    name: str

class TeamWorkspaceResponse(BaseModel):
    workspace_id: str
    name: str
    owner_id: str
    members: List[str] = []
    shared_analyses: List[str] = []

class ProposalCommentCreate(BaseModel):
    section: str                  # "executive_summary", "technical_proposal", etc.
    comment: str

class ProposalCommentResponse(BaseModel):
    comment_id: str
    analysis_id: str
    section: str
    user_id: str
    comment: str
    resolved: bool = False
    created_at: datetime

@router.post("/workspace", response_model=TeamWorkspaceResponse)
async def create_workspace(workspace_in: TeamWorkspaceCreate, current_user: dict = Depends(get_current_user)):
    workspace_id = str(uuid4())
    workspace = {
        "workspace_id": workspace_id,
        "name": workspace_in.name,
        "owner_id": current_user["user_id"],
        "members": [current_user["user_id"]],
        "shared_analyses": []
    }
    await mongodb.save_workspace(workspace)
    return workspace

@router.post("/workspace/{workspace_id}/members/{user_id}")
async def add_member(workspace_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    workspace = await mongodb.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    if workspace["owner_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Only the workspace owner can add members")
        
    # Check if target user exists
    target_user = await mongodb.get_user_by_id(user_id)
    if not target_user:
        # Check if user_id is an email
        if "@" in user_id:
            target_user = await mongodb.get_user_by_email(user_id)
            if target_user:
                user_id = target_user["user_id"]
            else:
                raise HTTPException(status_code=404, detail="User email not found")
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    await mongodb.add_workspace_member(workspace_id, user_id)
    return {"added": user_id, "status": "success"}

@router.post("/workspace/{workspace_id}/analyses/{analysis_id}/share")
async def share_analysis(workspace_id: str, analysis_id: str, current_user: dict = Depends(get_current_user)):
    workspace = await mongodb.get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    if current_user["user_id"] not in workspace.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
        
    analysis = await mongodb.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    await mongodb.share_analysis_to_workspace(workspace_id, analysis_id)
    return {"shared": True, "status": "success"}

@router.post("/analyses/{analysis_id}/comments", response_model=ProposalCommentResponse)
async def add_comment(
    analysis_id: str,
    comment_in: ProposalCommentCreate,
    current_user: dict = Depends(get_current_user)
):
    analysis = await mongodb.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    # Check if shared in a workspace user is in, or owned by user
    is_owner = analysis["user_id"] == current_user["user_id"]
    is_shared = False
    
    workspace = await mongodb.get_workspace_for_analysis(analysis_id)
    if workspace and current_user["user_id"] in workspace.get("members", []):
        is_shared = True
        
    if not is_owner and not is_shared:
        raise HTTPException(status_code=403, detail="Not authorized to comment on this analysis")
        
    comment_id = str(uuid4())
    comment = {
        "comment_id": comment_id,
        "analysis_id": analysis_id,
        "section": comment_in.section,
        "user_id": current_user["user_id"],
        "comment": comment_in.comment,
        "resolved": False,
        "created_at": datetime.utcnow()
    }
    
    await mongodb.save_comment(comment)
    
    # Broadcast realtime notification if workspace websocket exists (handled by analysis ws client)
    # Wait, we can broadcast via manager to the analysis_id ws!
    from routers.analysis import manager
    import json
    await manager.broadcast(json.dumps({
        "type": "new_comment",
        "section": comment_in.section,
        "user_id": current_user["user_id"],
        "comment": comment_in.comment,
        "comment_id": comment_id
    }), analysis_id)
    
    return comment

@router.get("/analyses/{analysis_id}/comments", response_model=List[ProposalCommentResponse])
async def list_comments(analysis_id: str, current_user: dict = Depends(get_current_user)):
    analysis = await mongodb.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    # Access checks
    is_owner = analysis["user_id"] == current_user["user_id"]
    is_shared = False
    workspace = await mongodb.get_workspace_for_analysis(analysis_id)
    if workspace and current_user["user_id"] in workspace.get("members", []):
        is_shared = True
        
    if not is_owner and not is_shared:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return await mongodb.get_comments(analysis_id)

@router.patch("/analyses/{analysis_id}/comments/{comment_id}/resolve")
async def resolve_comment(analysis_id: str, comment_id: str, current_user: dict = Depends(get_current_user)):
    # Check authorization (if user can see analysis)
    analysis = await mongodb.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    is_owner = analysis["user_id"] == current_user["user_id"]
    is_shared = False
    workspace = await mongodb.get_workspace_for_analysis(analysis_id)
    if workspace and current_user["user_id"] in workspace.get("members", []):
        is_shared = True
        
    if not is_owner and not is_shared:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    await mongodb.resolve_comment(comment_id)
    return {"resolved": True}
