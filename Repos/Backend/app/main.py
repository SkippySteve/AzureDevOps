import os
from fastapi import FastAPI, Depends, Body
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from . import crud, spamDetectionModel, models
from .db import SessionDep, lifespan
from sqlmodel import select
from .auth.auth_handler import sign_jwt, decode_jwt
from bcrypt import gensalt, hashpw, checkpw
from .auth.auth_bearer import JWTBearer, AdminJWTBearer
from zoneinfo import ZoneInfo
import resend
from .config import settings
import joblib

app = FastAPI(lifespan=lifespan)

app.mount("/Visualizations", StaticFiles(directory="app/Visualizations"), name="visualizations")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "https://capstone.stevenrichards.link",
    FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.exists("app/spamModel.pkl"):
    print("Loading model from disk")
    model = joblib.load("app/spamModel.pkl")
    print("Loaded model with accuracy: ", model.accuracy)
else:
    model = spamDetectionModel.SpamDetectionModel()
    joblib.dump(model, "app/spamModel.pkl")

jwt_bearer = JWTBearer() 
admin_bearer = AdminJWTBearer()

resend.api_key = settings.RESEND_API_KEY

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/accuracy")
async def accuracy():
    return model.accuracy

@app.get("/emails")
async def emails(db: SessionDep):
    results = await db.execute(select(models.Email))
    emails = results.scalars().all()
    emails_dict = []
    for email in emails:
        predictions = await db.execute(select(models.Prediction).where(models.Prediction.email_id == email.email_id))
        prediction_results = predictions.scalars().all()
        #create email dictionary obj in python so predictions can be attached as a key, val
        email_dict = email.model_dump()
        preds_list = []
        for pred in prediction_results:
            pred_dict = pred.model_dump()
            est_time = pred_dict["created_at"].astimezone(ZoneInfo(key='America/Detroit'))
            est_time_string = est_time.strftime("%Y-%m-%d %I:%M:%S %p")
            pred_dict["created_at"] = est_time_string + " EST"
            preds_list.append(pred_dict)
        email_dict["predictions"] = preds_list
        emails_dict.append(email_dict)
    return emails_dict

@app.post("/user/signup", tags=["user"])
async def create_user(db: SessionDep, user: models.UserSchema = Body(...)):
    result = await db.execute(select(models.User).where(models.User.email == user.email))
    email = result.scalars().first()
    if email is None:
        pass_bytes = user.password.encode('utf-8')
        salt = gensalt()
        hash = hashpw(pass_bytes, salt)
        newUser = models.User(email=user.email, fullname=user.fullname, password=hash)
        db.add(newUser)
        await db.commit()
        admin_users_result = await db.execute(select(models.User.email).where(models.User.admin == True))
        admins_list = admin_users_result.scalars().all()
        params: resend.Emails.SendParams = {
            "from": "StevenRichards.link ML Onboarding <onboarding@stevenrichards.link>",
            "to": admins_list,
            "subject": "New User Request",
            "html": "User " + user.email + " requesting approval",
        }
        try:
            resend.Emails.send(params)
        except:
            return {"Error": "Server error"}
        return {"Success": "User account created. Admin activation still required."}
    else:
        return {"Error": "User with supplied email already exists"}
    
@app.post("/user/login", tags=["user"])
async def user_login(db: SessionDep, req_user: models.UserLoginSchema = Body(...)):
    result = await db.execute(select(models.User).where(models.User.email == req_user.email))
    db_user = result.scalars().first()
    if db_user is not None:
        if db_user.active == False:
            return {"Error": "User account isn't activated"}
        pass_bytes = req_user.password.encode('utf-8')
        if checkpw(pass_bytes, db_user.password):
            return {"Success": "User successfully signed in", "JWT": sign_jwt(req_user.email)["access_token"]}
    return {"Error": "Wrong login credentials"}

@app.get("/user", tags=["user"], dependencies=[Depends(jwt_bearer)])
async def get_user(db: SessionDep, jwt=Depends(jwt_bearer)):
    decoded_user = decode_jwt(jwt)
    stmt = select(models.User).where(models.User.email == decoded_user["user_id"])
    result = await db.execute(stmt)
    db_user = result.scalars().one()
    if db_user:
        return {"email": db_user.email, "fullname": db_user.fullname, "admin": db_user.admin, "active": db_user.active}
    return {"Error": "User not found"}

@app.post("/llm_prediction", tags=["require login"], dependencies=[Depends(jwt_bearer)])
async def llm_prediction(request: models.CreateAISpam, db: SessionDep):
    success = await crud.create_llm_prediction(db, request.predict_spam, model, "LLM")
    response = {"status": "Spam"} if success == True else {"status": "Not Spam"}
    return response

@app.post("/user_prediction", tags=["require login"], dependencies=[Depends(jwt_bearer)])
async def user_prediction(request: models.EmailCreate, db: SessionDep):
    success = await crud.create_prediction(db, request.text, model, "USER")
    response = {"status": "Spam"} if success == True else {"status": "Not Spam"}
    return response

@app.post("/dataset_prediction", tags=["require login"], dependencies=[Depends(jwt_bearer)])
async def dataset_prediction(request: models.DatasetPredict, db: SessionDep):
    dataset_email = model.dataset[0][request.id]
    is_spam_label = model.dataset[1][request.id]
    is_spam_bool = True if is_spam_label == "spam" else False
    success = await crud.create_prediction(db, dataset_email, model, "DATASET", is_spam_bool)
    response = {"status": "Spam"} if success == True else {"status": "Not Spam"}
    return response

@app.post("/user/activate", tags=["require admin"], dependencies=[Depends(admin_bearer)])
async def user_activate(db: SessionDep, req_user: models.UserActivateSchema = Body(...)):
    result = await db.execute(select(models.User).where(models.User.email == req_user.email))
    db_user = result.scalars().first()
    if db_user is not None:
        db_user.active = True if db_user.active == False else False
        await db.commit()
        params: resend.Emails.SendParams = {
            "from": "StevenRichards.link ML <activations@stevenrichards.link>",
            "to": db_user.email,
            "subject": "Account Activated",
            "html": "Your account has been activated! Login here: https://capstone.stevenrichards.link",
        }
        #try:
        #    resend.Emails.send(params)
        #except:
        #    return {"Error": "Server error"}
        return {"Success": "User activation status changed succesfully"}
    return {"Error": "User not found"}

@app.post("/user/add_admin", tags=["require admin"], dependencies=[Depends(admin_bearer)])
async def add_admin(db: SessionDep, req_user: models.UserActivateSchema = Body(...)):
    result = await db.execute(select(models.User).where(models.User.email == req_user.email))
    db_user = result.scalars().first()
    if db_user is not None:
        db_user.admin = True if db_user.admin == False else False
        await db.commit()
        params: resend.Emails.SendParams = {
            "from": "StevenRichards.link ML <activations@stevenrichards.link>",
            "to": db_user.email,
            "subject": "Account is now Admin",
            "html": "You have been made an Admin! Wield your responsibility wisely! Login here: https://capstone.stevenrichards.link",
        }
        #try:
        #    resend.Emails.send(params)
        #except:
        #    return {"Error": "Server error"}
        return {"Success": "User is now an admin"}
    return {"Error": "User not found"}

@app.get("/users", tags=["require admin"], dependencies=[Depends(admin_bearer)])
async def get_not_active_users(db: SessionDep):
    stmt = select(models.User.email, models.User.fullname, models.User.admin, models.User.active)
    result = await db.execute(stmt)
    db_users = result.fetchall()
    users = []
    for email, fullname, admin, active in db_users:
        users.append({"email": email, "fullname": fullname, "admin": admin, "active": active})
    return users