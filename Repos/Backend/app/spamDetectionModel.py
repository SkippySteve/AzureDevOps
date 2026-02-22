import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, learning_curve
from sklearn import svm
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn import metrics
from sklearn.pipeline import make_pipeline
import matplotlib.pyplot as plt

        #self.model, self.tf = self.train_model()
'''
    def load_model(self):
        print("Loading model from disk")
        df = pd.read_csv("app/mail_data.csv")
        X = df["Message"]
        Y = df["Category"]
        self.dataset = [X, Y]
        return [joblib.load("app/model.pkl"), joblib.load("app/tf.pkl")]
'''

    #def train_model(self):

class SpamDetectionModel:
    def __init__(self):
        # Kaggle Dataset Link : https://www.kaggle.com/datasets/mohinurabdurahimova/maildataset
        # Some versions of this dataset include the full email with metadata, this one just contains the email body text and classification.
        df = pd.read_csv("app/mail_data.csv")
        self.tf = TfidfVectorizer(min_df=1, stop_words="english", lowercase=True)
        self.model = svm.SVC()
        X = df["Message"]
        Y = df["Category"]
        X_train, X_test, Y_train, Y_test = train_test_split(X, Y, random_state=41)

        # Save dataset to object so it can be used for manual testing of data from dataset        
        self.dataset = [X, Y]

        # Vectorization
        x_train_vec = self.tf.fit_transform(X_train.values)
        x_test_vec = self.tf.transform(X_test.values)

        # Model Training
        self.model.fit(x_train_vec, Y_train)

        # Model Evaluation
        y_pred_train = self.model.predict(x_train_vec)
        y_pred_test = self.model.predict(x_test_vec)
        print(f"Trained model with accuracy: {metrics.accuracy_score(Y_test, y_pred_test):.2%}")
        self.accuracy = f"{metrics.accuracy_score(Y_test, y_pred_test):.2%}"

        # Visualizations

        # Confusion Matrix
        confMatrix = metrics.ConfusionMatrixDisplay.from_estimator(self.model, x_test_vec, Y_test)
        confMatrix.plot().figure_.savefig("app/Visualizations/confusion_matrix.png")

        # ROC Curve
        y_scores = self.model.decision_function(self.tf.transform(X_test))
        fpr, tpr, _ = metrics.roc_curve(Y_test, y_scores, pos_label="spam")
        roc_auc = metrics.auc(fpr, tpr)
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (AUC = {roc_auc:.2f})')
        plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('Receiver Operating Characteristic (ROC) Curve')
        plt.legend(loc="lower right")
        plt.savefig("app/Visualizations/roc_curve.png")

        # Learning Curve
        
        pipeline = make_pipeline(self.tf, self.model)

        train_sizes, train_scores, test_scores = learning_curve(pipeline, X, Y, cv=5, n_jobs=-1, train_sizes=np.linspace(0.1, 1.0, 10))

        train_mean = np.mean(train_scores, axis=1)
        train_std = np.std(train_scores, axis=1)
        test_mean = np.mean(test_scores, axis=1)
        test_std = np.std(test_scores, axis=1)

        plt.figure(figsize=(10, 6))
        plt.plot(train_sizes, train_mean, color='blue', marker='o', markersize=5, label='Training accuracy')
        plt.fill_between(train_sizes, train_mean + train_std, train_mean - train_std, alpha=0.15, color='blue')
        plt.plot(train_sizes, test_mean, color='green', linestyle='--', marker='s', markersize=5, label='Testing accuracy')
        plt.fill_between(train_sizes, test_mean + test_std, test_mean - test_std, alpha=0.15, color='green')
        plt.xlabel('Number of training samples')
        plt.ylabel('Accuracy')
        plt.title('Learning Curve')
        plt.legend(loc='lower right')
        plt.savefig("app/Visualizations/learning_curve.png")


    def predict(self, email):
        email_vec = self.tf.transform([email])
        prediction = self.model.predict(email_vec)
        return prediction



