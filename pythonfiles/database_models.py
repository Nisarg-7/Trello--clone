from sqlalchemy import Boolean, Column, String, Integer, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base 

board_member = Table(
    'board_member',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('board_id', Integer, ForeignKey('board.id', ondelete='CASCADE'), primary_key=True)
)

card_member = Table(
    'card_member',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('card_id', Integer, ForeignKey('card.id', ondelete='CASCADE'), primary_key=True)
)

card_label = Table(
    'card_label',
    Base.metadata,
    Column('card_id', Integer, ForeignKey('card.id', ondelete='CASCADE'), primary_key=True),
    Column('board_label_id', Integer, ForeignKey('board_label.id', ondelete='CASCADE'), primary_key=True)
)



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email_address = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)

    owned_boards = relationship("Board", back_populates="owner", cascade="all, delete-orphan")
    board_memberships = relationship("Board", secondary=board_member, back_populates="members")
    card_memberships = relationship("Card", secondary=card_member, back_populates="members")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")


class Board(Base):
    __tablename__ = "board"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    owner_user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True),server_default=func.now())

    owner = relationship("User", back_populates="owned_boards")
    members = relationship("User", secondary=board_member, back_populates="board_memberships")
    lists = relationship("List", back_populates="board", cascade="all, delete-orphan")
    board_labels = relationship("BoardLabel", back_populates="board", cascade="all, delete-orphan")


class List(Base):
    __tablename__ = "list"
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    board_id = Column(Integer, ForeignKey('board.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    position = Column(Integer, nullable=False)

    board = relationship("Board", back_populates="lists")
    cards = relationship("Card", back_populates="list", cascade="all, delete-orphan")


class Card(Base):
    __tablename__ = "card"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    list_id = Column(Integer, ForeignKey('list.id', ondelete='CASCADE'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    list = relationship("List", back_populates="cards")
    members = relationship("User", secondary=card_member, back_populates="card_memberships")
    comments = relationship("Comment", back_populates="card", cascade="all, delete-orphan")
    checklist_items = relationship("ChecklistItem", back_populates="card", cascade="all, delete-orphan")
    attachments = relationship("CardAttachment", back_populates="card", cascade="all, delete-orphan")
    labels = relationship("BoardLabel", secondary=card_label, back_populates="cards")


class Comment(Base):
    __tablename__ = "comment"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    card_id = Column(Integer, ForeignKey('card.id', ondelete='CASCADE'), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="comments")
    card = relationship("Card", back_populates="comments")


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    card_id = Column(Integer, ForeignKey('card.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    is_checked = Column(Boolean, default=False)
    position = Column(Integer, nullable=False)

    card = relationship("Card", back_populates="checklist_items")


class BoardLabel(Base):
    __tablename__ = "board_label"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    board_id = Column(Integer, ForeignKey('board.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, nullable=True)

    board = relationship("Board", back_populates="board_labels")
    cards = relationship("Card", secondary=card_label, back_populates="labels")



class CardAttachment(Base):
    __tablename__ = "card_attachment"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    card_id = Column(Integer, ForeignKey('card.id', ondelete='CASCADE'), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    location = Column(String, nullable=False)
    filename = Column(String, nullable=False)

    card = relationship("Card", back_populates="attachments")

  