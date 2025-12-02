from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime 


class UserBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_address: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_address: Optional[EmailStr] = None
    password: Optional[str] = None

class User(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class Config:
        schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }



class BoardBase(BaseModel):
    name: str
    is_public: bool = False

class BoardCreate(BoardBase):
    pass

class BoardUpdate(BaseModel):
    name: Optional[str] = None
    is_public: Optional[bool] = None

class Board(BoardBase):
    id: int
    owner_user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class ListBase(BaseModel):
    name: str
    position: int

class ListCreate(ListBase):
    board_id: int

class ListUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[int] = None

class ListSchema(ListBase):
    id: int
    board_id: int

    model_config = ConfigDict(from_attributes=True)



class CardBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_active: bool = True
    due_date: Optional[datetime] = None

class CardCreate(CardBase):
    list_id: int

class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    due_date: Optional[datetime] = None
    list_id: Optional[int] = None

class Card(CardBase):
    id: int
    list_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



class CommentBase(BaseModel):
    comment: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    comment: str

class Comment(CommentBase):
    id: int
    user_id: int
    card_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class ChecklistItemBase(BaseModel):
    name: str
    is_checked: bool = False
    position: int

class ChecklistItemCreate(ChecklistItemBase):
    card_id: int

class ChecklistItemUpdate(BaseModel):
    name: Optional[str] = None
    is_checked: Optional[bool] = None
    position: Optional[int] = None

class ChecklistItem(ChecklistItemBase):
    id: int
    card_id: int

    model_config = ConfigDict(from_attributes=True)




# Board Label Schemas
class BoardLabelBase(BaseModel):
    name: str
    color: Optional[str] = None


class BoardLabelCreate(BoardLabelBase):
    board_id: int


class BoardLabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class BoardLabel(BoardLabelBase):
    id: int
    board_id: int

    model_config = ConfigDict(from_attributes=True)





class CardAttachmentBase(BaseModel):
    location: str
    filename: str

class CardAttachmentCreate(CardAttachmentBase):
    card_id: int

class CardAttachment(CardAttachmentBase):
    id: int
    card_id: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)



class BoardMemberAdd(BaseModel):
    user_id: int
    board_id: int

class BoardMemberRemove(BaseModel):
    user_id: int
    board_id: int



class CardMemberAdd(BaseModel):
    user_id: int
    card_id: int

class CardMemberRemove(BaseModel):
    user_id: int
    card_id: int



class CardLabelAdd(BaseModel):
    card_id: int
    board_label_id: int

class CardLabelRemove(BaseModel):
    card_id: int
    board_label_id: int








