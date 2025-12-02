import token
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
import pythonfiles.models as models
from . import database_models
from .database import SessionLocal, engine
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from .auth import ALGORITHM, SECRET_KEY, create_access_token, get_current_user
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt



oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "login")
    
database_models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



@app.get("/users", response_model=List[models.User])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(database_models.User).all()
    return users


@app.get("/users/{user_id}", response_model=models.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/users", response_model=models.User, status_code=status.HTTP_201_CREATED)
def create_user(user: models.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(database_models.User).filter(
        database_models.User.email_address == user.email_address
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = database_models.User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.put("/users/{user_id}", response_model=models.User)
def update_user(user_id: int, user: models.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return None


class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"

@app.post("/login/")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    
    user = db.query(database_models.User).filter(database_models.User.email_address == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not registered. Please register first"
        )

    
    if str(user.password) != form_data.password:  
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    
    token = create_access_token(data={"sub": user.email_address})
    return {"access_token": token, "token_type": "bearer", "user_id": user.id, "user_name": user.first_name}

@app.get("/protected")
def protected_route(current_user: database_models.User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.email_address}, you are authenticated!"}




@app.get("/boards", response_model=List[models.Board])
def get_all_boards(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(database_models.Board)
    if user_id:
        query = query.filter(database_models.Board.owner_user_id == user_id)
    boards = query.all()
    return boards


@app.get("/boards/{board_id}", response_model=models.Board)
def get_board(board_id: int, db: Session = Depends(get_db)):
    board = db.query(database_models.Board).filter(database_models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@app.post("/boards", response_model=models.Board, status_code=status.HTTP_201_CREATED)
def create_board(
    board: models.BoardCreate,
    db: Session = Depends(get_db),
    current_user: database_models.User = Depends(get_current_user)
):
    db_board = database_models.Board(
        **board.model_dump(),
        owner_user_id=current_user.id
    )
    db.add(db_board)
    db.commit()
    db.refresh(db_board)
    return db_board


@app.put("/boards/{board_id}", response_model=models.Board)
def update_board(board_id: int, board: models.BoardUpdate, db: Session = Depends(get_db)):
    db_board = db.query(database_models.Board).filter(database_models.Board.id == board_id).first()
    if not db_board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    update_data = board.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_board, field, value)
    
    db.commit()
    db.refresh(db_board)
    return db_board


@app.delete("/boards/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(board_id: int, db: Session = Depends(get_db)):
    db_board = db.query(database_models.Board).filter(database_models.Board.id == board_id).first()
    if not db_board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    db.delete(db_board)
    db.commit()
    return None





@app.get("/boards/{board_id}/lists", response_model=List[models.ListSchema])
def get_board_lists(board_id: int, db: Session = Depends(get_db)):
    board = db.query(database_models.Board).filter(database_models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    lists = db.query(database_models.List).filter(
        database_models.List.board_id == board_id
    ).order_by(database_models.List.position).all()
    return lists


@app.get("/lists/{list_id}", response_model=models.ListSchema)
def get_list(list_id: int, db: Session = Depends(get_db)):
    list_item = db.query(database_models.List).filter(database_models.List.id == list_id).first()
    if not list_item:
        raise HTTPException(status_code=404, detail="List not found")
    return list_item


@app.post("/boards/{board_id}/lists", response_model=models.ListSchema, status_code=status.HTTP_201_CREATED)
def create_list(board_id: int, list_data: models.ListBase, db: Session = Depends(get_db)):
    # Verify board exists
    board = db.query(database_models.Board).filter(database_models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    db_list = database_models.List(**list_data.model_dump(), board_id=board_id)
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list


@app.put("/lists/{list_id}", response_model=models.ListSchema)
def update_list(list_id: int, list_data: models.ListUpdate, db: Session = Depends(get_db)):
    db_list = db.query(database_models.List).filter(database_models.List.id == list_id).first()
    if not db_list:
        raise HTTPException(status_code=404, detail="List not found")
    
    update_data = list_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_list, field, value)
    
    db.commit()
    db.refresh(db_list)
    return db_list


@app.delete("/lists/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list(list_id: int, db: Session = Depends(get_db)):
    db_list = db.query(database_models.List).filter(database_models.List.id == list_id).first()
    if not db_list:
        raise HTTPException(status_code=404, detail="List not found")
    
    db.delete(db_list)
    db.commit()
    return None





@app.get("/lists/{list_id}/cards", response_model=List[models.Card])
def get_list_cards(list_id: int, db: Session = Depends(get_db)):
   
    list_item = db.query(database_models.List).filter(database_models.List.id == list_id).first()
    if not list_item:
        raise HTTPException(status_code=404, detail="List not found")
    
    cards = db.query(database_models.Card).filter(database_models.Card.list_id == list_id).all()
    return cards


@app.get("/cards/{card_id}", response_model=models.Card)
def get_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@app.post("/lists/{list_id}/cards", response_model=models.Card, status_code=status.HTTP_201_CREATED)
def create_card(list_id: int, card: models.CardBase, db: Session = Depends(get_db)):
    
    list_item = db.query(database_models.List).filter(database_models.List.id == list_id).first()
    if not list_item:
        raise HTTPException(status_code=404, detail="List not found")
    
    db_card = database_models.Card(**card.model_dump(), list_id=list_id)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card


@app.put("/cards/{card_id}", response_model=models.Card)
def update_card(card_id: int, card: models.CardUpdate, db: Session = Depends(get_db)):
    db_card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    update_data = card.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_card, field, value)
    
    db.commit()
    db.refresh(db_card)
    return db_card


@app.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(card_id: int, db: Session = Depends(get_db)):
    db_card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    db.delete(db_card)
    db.commit()
    return None





@app.get("/cards/{card_id}/comments", response_model=List[models.Comment])
def get_card_comments(card_id: int, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    comments = db.query(database_models.Comment).filter(
        database_models.Comment.card_id == card_id
    ).order_by(database_models.Comment.created_at.desc()).all()
    return comments


@app.get("/comments/{comment_id}", response_model=models.Comment)
def get_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(database_models.Comment).filter(database_models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


@app.post("/cards/{card_id}/comments", response_model=models.Comment, status_code=status.HTTP_201_CREATED)
def create_comment(user_id: int, card_id: int, comment: models.CommentBase, db: Session = Depends(get_db)):
    
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_comment = database_models.Comment(**comment.model_dump(), card_id=card_id, user_id=user_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


@app.put("/comments/{comment_id}", response_model=models.Comment)
def update_comment(comment_id: int, comment: models.CommentUpdate, db: Session = Depends(get_db)):
    db_comment = db.query(database_models.Comment).filter(database_models.Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    db_comment.comment = comment.comment
    db.commit()
    db.refresh(db_comment)
    return db_comment


@app.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    db_comment = db.query(database_models.Comment).filter(database_models.Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    db.delete(db_comment)
    db.commit()
    return None






@app.get("/cards/{card_id}/checklist-items", response_model=List[models.ChecklistItem])
def get_card_checklist_items(card_id: int, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    items = db.query(database_models.ChecklistItem).filter(
        database_models.ChecklistItem.card_id == card_id
    ).order_by(database_models.ChecklistItem.position).all()
    return items


@app.get("/checklist-items/{item_id}", response_model=models.ChecklistItem)
def get_checklist_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(database_models.ChecklistItem).filter(database_models.ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    return item


@app.post("/cards/{card_id}/checklist-items", response_model=models.ChecklistItem, status_code=status.HTTP_201_CREATED)
def create_checklist_item(card_id: int, item: models.ChecklistItemBase, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    db_item = database_models.ChecklistItem(**item.model_dump(), card_id=card_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.put("/checklist-items/{item_id}", response_model=models.ChecklistItem)
def update_checklist_item(item_id: int, item: models.ChecklistItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(database_models.ChecklistItem).filter(database_models.ChecklistItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    update_data = item.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item


@app.delete("/checklist-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(database_models.ChecklistItem).filter(database_models.ChecklistItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    db.delete(db_item)
    db.commit()
    return None





@app.get("/boards/{board_id}/labels", response_model=List[models.BoardLabel])
def get_board_labels(board_id: int, db: Session = Depends(get_db)):
    board = db.query(database_models.Board).filter(database_models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    labels = db.query(database_models.BoardLabel).filter(database_models.BoardLabel.board_id == board_id).all()
    return labels


@app.get("/labels/{label_id}", response_model=models.BoardLabel)
def get_label(label_id: int, db: Session = Depends(get_db)):
    label = db.query(database_models.BoardLabel).filter(database_models.BoardLabel.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    return label


@app.post("/boards/{board_id}/labels", response_model=models.BoardLabel, status_code=status.HTTP_201_CREATED)
def create_label(board_id: int, label: models.BoardLabelBase, db: Session = Depends(get_db)):
    board = db.query(database_models.Board).filter(database_models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    db_label = database_models.BoardLabel(**label.model_dump(), board_id=board_id)
    db.add(db_label)
    db.commit()
    db.refresh(db_label)
    return db_label


@app.put("/labels/{label_id}", response_model=models.BoardLabel)
def update_label(label_id: int, label: models.BoardLabelUpdate, db: Session = Depends(get_db)):
    db_label = db.query(database_models.BoardLabel).filter(database_models.BoardLabel.id == label_id).first()
    if not db_label:
        raise HTTPException(status_code=404, detail="Label not found")
    
    update_data = label.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_label, field, value)
    
    db.commit()
    db.refresh(db_label)
    return db_label


@app.delete("/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_label(label_id: int, db: Session = Depends(get_db)):
    db_label = db.query(database_models.BoardLabel).filter(database_models.BoardLabel.id == label_id).first()
    if not db_label:
        raise HTTPException(status_code=404, detail="Label not found")
    
    db.delete(db_label)
    db.commit()
    return None





@app.get("/cards/{card_id}/attachments", response_model=List[models.CardAttachment])
def get_card_attachments(card_id: int, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    attachments = db.query(database_models.CardAttachment).filter(
        database_models.CardAttachment.card_id == card_id
    ).order_by(database_models.CardAttachment.uploaded_at.desc()).all()
    return attachments


@app.get("/attachments/{attachment_id}", response_model=models.CardAttachment)
def get_attachment(attachment_id: int, db: Session = Depends(get_db)):
    attachment = db.query(database_models.CardAttachment).filter(
        database_models.CardAttachment.id == attachment_id
    ).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return attachment


@app.post("/cards/{card_id}/attachments", response_model=models.CardAttachment, status_code=status.HTTP_201_CREATED)
def create_attachment(card_id: int, attachment: models.CardAttachmentBase, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    db_attachment = database_models.CardAttachment(**attachment.model_dump(), card_id=card_id)
    db.add(db_attachment)
    db.commit()
    db.refresh(db_attachment)
    return db_attachment


@app.put("/attachments/{attachment_id}", response_model=models.CardAttachment)
def update_attachment(attachment_id: int, location: str, filename: str, db: Session = Depends(get_db)):
    db_attachment = db.query(database_models.CardAttachment).filter(
        database_models.CardAttachment.id == attachment_id
    ).first()
    if not db_attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    db_attachment.location = location
    db_attachment.filename = filename
    db.commit()
    db.refresh(db_attachment)
    return db_attachment


@app.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    db_attachment = db.query(database_models.CardAttachment).filter(
        database_models.CardAttachment.id == attachment_id
    ).first()
    if not db_attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    db.delete(db_attachment)
    db.commit()
    return None





@app.get("/boards/{board_id}/members", response_model=List[models.User])
def get_board_members(board_id: int, db: Session = Depends(get_db)):
    board = db.query(database_models.Board).filter(database_models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    return board.members


@app.post("/boards/{board_id}/members", status_code=status.HTTP_201_CREATED)
def add_board_member(board_id: int, user_id: int, db: Session = Depends(get_db)):
    board = db.query(database_models.Board).filter(database_models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user in board.members:
        raise HTTPException(status_code=400, detail="User is already a board member")
    
    board.members.append(user)
    db.commit()
    return {"message": "User added to board successfully"}


@app.delete("/boards/{board_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_board_member(board_id: int, user_id: int, db: Session = Depends(get_db)):
   
    board = db.query(database_models.Board).filter(database_models.Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user not in board.members:
        raise HTTPException(status_code=400, detail="User is not a board member")
    
    board.members.remove(user)
    db.commit()
    return None





@app.get("/cards/{card_id}/members", response_model=List[models.User])
def get_card_members(card_id: int, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    return card.members


@app.post("/cards/{card_id}/members", status_code=status.HTTP_201_CREATED)
def add_card_member(card_id: int, user_id: int, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user in card.members:
        raise HTTPException(status_code=400, detail="User is already assigned to this card")
    
    card.members.append(user)
    db.commit()
    return {"message": "User assigned to card successfully"}


@app.delete("/cards/{card_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_card_member(card_id: int, user_id: int, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    user = db.query(database_models.User).filter(database_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user not in card.members:
        raise HTTPException(status_code=400, detail="User is not assigned to this card")
    
    card.members.remove(user)
    db.commit()
    return None



@app.get("/cards/{card_id}/labels", response_model=List[models.BoardLabel])
def get_card_labels(card_id: int, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    return card.labels


@app.post("/cards/{card_id}/labels", status_code=status.HTTP_201_CREATED)
def add_card_label(card_id: int, label_id: int, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    label = db.query(database_models.BoardLabel).filter(database_models.BoardLabel.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    
    if label in card.labels:
        raise HTTPException(status_code=400, detail="Label already added to this card")
    
    card.labels.append(label)
    db.commit()
    return {"message": "Label added to card successfully"}


@app.delete("/cards/{card_id}/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_card_label(card_id: int, label_id: int, db: Session = Depends(get_db)):
    card = db.query(database_models.Card).filter(database_models.Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    label = db.query(database_models.BoardLabel).filter(database_models.BoardLabel.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    
    if label not in card.labels:
        raise HTTPException(status_code=400, detail="Label is not added to this card")
    
    card.labels.remove(label)
    db.commit()
    return None


