from sqlalchemy import Column, DateTime, func
import enum, datetime
from sqlmodel import SQLModel, Field, Enum
from typing import Optional
from pydantic import EmailStr
import pytz

class User(SQLModel, table=True):
    email: EmailStr = Field(default=None, primary_key=True)
    fullname: str
    password: str
    active: bool = Field(default=False)
    admin: bool = Field(default=False)

class TypeOfEmail(str, enum.Enum):
    DATASET = "DATASET"
    LLM = "LLM"
    USER = "USER"

class Email(SQLModel, table=True):
    email_id: int | None = Field(default=None, primary_key=True)
    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(pytz.timezone('US/Eastern')),
    )
    text: str = Field(index=True)


class Prediction(SQLModel, table=True):
    prediction_id: int | None = Field(default=None, primary_key=True)
    created_at: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(pytz.timezone('US/Eastern')),
    )
    updated_at: Optional[datetime.datetime] = Field(
        sa_column=Column(DateTime(), onupdate=func.now())
    )

    email_id: int = Field(default=None, foreign_key="email.email_id")
    my_model_predicts_spam: bool
    llm_predicts_spam: bool | None
    prediction_type: TypeOfEmail = Field(sa_column=Column(Enum(TypeOfEmail)))



class EmailCreate(SQLModel):
    text: str

class CreateAISpam(SQLModel):
    predict_spam: bool

class GetPredictions(SQLModel):
    email_id: int

class DatasetPredict(SQLModel):
    id: Optional[int]

class AuthPassword(SQLModel):
    password: str

class UserSchema(SQLModel):
    fullname: str = Field(...)
    email: EmailStr = Field(...)
    password: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "fullname": "Skippy",
                "email": "steve@aimingupward.com",
                "password": "weakpassword",
            }
        }

class UserLoginSchema(SQLModel):
    email: EmailStr = Field(...)
    password: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {"email": "steve@aimingupward.com", "password": "weakpassword"}
        }

class UserActivateSchema(SQLModel):
    email: EmailStr