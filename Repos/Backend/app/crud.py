import requests
from sqlmodel import select
from openai import OpenAI
from .db import SessionDep
from .models import *
from .spamDetectionModel import SpamDetectionModel
from .config import settings

client = OpenAI(
    api_key=settings.OPENAI_API_KEY, 
    base_url=settings.OPENAI_API_URL
    )

def get_prediction(db: SessionDep, prediction_id: int):
    return db.query(Prediction).filter(Prediction.id == prediction_id).first()

def get_prediction_by_text(db: SessionDep, text: str):
    return db.query(Prediction).filter(Prediction.text == text).all()

def get_predictions(db: SessionDep, skip: int = 0, limit: int = 100):
    result = db.query(Prediction).offset(skip).limit(limit).all()
    return result

async def create_prediction(db: SessionDep, emailText: str, model: SpamDetectionModel, predictionType: TypeOfEmail, is_spam: bool=None):
    result = await db.execute(select(Email).where(Email.text == emailText))
    email = result.scalars().first()
    if email is None:
        email = Email(text=emailText)
        db.add(email)
        await db.commit()
        await db.refresh(email)
    predictionArray = model.predict(email.text)
    prediction = True if predictionArray[0] == "spam" else False
    predictionDB = Prediction(email_id=email.email_id, my_model_predicts_spam=prediction, prediction_type=predictionType, llm_predicts_spam=is_spam)
    db.add(predictionDB)
    await db.commit()
    await db.refresh(predictionDB)
    return prediction

async def create_llm_prediction(db: SessionDep, is_spam_bool: bool, model: SpamDetectionModel, typeOfPrediction: TypeOfEmail):
    is_spam = "spam" if is_spam_bool else "ham"
    
    messages = [{
        "role": "system",
        "content": """Fulfill the user's request without explaining anything. 
        For example, do not explain why what you are providing fulfills the user's request. 
        Simply provide what is asked, nothing more, nothing less.
        Do not include new line breaks, including with the "slash n" notation.
        Do not use placeholders like [Recipient's Name], instead make something up.
        Do not use placeholders for ficticious links, either make something up or don't include it at all.
        Do not use the same response that you've provided before, provide a different example each time."""
        },{
        "role": "user",
        "content": "Create an email body similar to those found in the Enron 'spam or ham' dataset, in a style similar to those labeled as " + is_spam
    }]


    response = client.chat.completions.create(
        model="llama-3.1-sonar-huge-128k-online",
        messages=messages,
    )

    status = await create_prediction(db, response.choices[0].message.content, model, "LLM", is_spam_bool)
    return status