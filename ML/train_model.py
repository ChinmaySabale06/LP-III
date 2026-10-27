import os
import re
import json
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


def extract_title(name):
    """Extract a title such as Mr, Mrs, or Miss from a passenger's name."""
    match = re.search(r",\s*([^.]*)\.", str(name))
    if not match:
        return "Unknown"
    title = match.group(1).strip()
    common_titles = {"Mr", "Mrs", "Miss", "Master", "Dr", "Rev", "Col", "Major",
                     "Mlle", "Mme", "Ms", "Sir", "Lady", "Capt", "Don", "Jonkheer",
                     "the Countess"}
    return title if title in common_titles else "Rare"


def prepare_features(df):
    data = df.copy()
    data["Title"] = data["Name"].apply(extract_title)
    data["FamilySize"] = data["SibSp"] + data["Parch"] + 1
    data["IsAlone"] = (data["FamilySize"] == 1).astype(int)
    return data[["Pclass", "Sex", "Age", "Fare", "Embarked", "Title", "FamilySize", "IsAlone"]]


def build_model():
    numeric_features = ["Pclass", "Age", "Fare", "FamilySize", "IsAlone"]
    categorical_features = ["Sex", "Embarked", "Title"]

    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])
    preprocess = ColumnTransformer([
        ("numeric", numeric_pipeline, numeric_features),
        ("categorical", categorical_pipeline, categorical_features),
    ])
    return Pipeline([
        ("preprocess", preprocess),
        ("classifier", LogisticRegression(max_iter=2000, class_weight="balanced")),
    ])


def main():
    if not os.path.exists("train.csv"):
        raise FileNotFoundError(
            "train.csv not found. Download it from the Kaggle Titanic competition page "
            "and place it in the same folder as this script."
        )

    df = pd.read_csv("train.csv")
    if "Survived" not in df.columns:
        raise ValueError("train.csv must contain the 'Survived' target column.")

    X = prepare_features(df)
    y = df["Survived"]
    X_train, X_valid, y_train, y_valid = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    evaluation_model = build_model()
    evaluation_model.fit(X_train, y_train)
    predictions = evaluation_model.predict(X_valid)
    accuracy = accuracy_score(y_valid, predictions)
    report = classification_report(
        y_valid, predictions, target_names=["Did not survive", "Survived"], zero_division=0
    )
    matrix = confusion_matrix(y_valid, predictions).tolist()

    print(f"Validation accuracy: {accuracy:.3f}")
    print("\nClassification report:\n")
    print(report)
    print("Confusion matrix (rows=actual, columns=predicted):")
    print(matrix)

    with open("evaluation_report.txt", "w", encoding="utf-8") as f:
        f.write(f"Validation accuracy: {accuracy:.3f}\n\n")
        f.write("Classification report:\n")
        f.write(report)
        f.write("\nConfusion matrix (rows=actual, columns=predicted):\n")
        f.write(str(matrix))
    with open("metrics.json", "w", encoding="utf-8") as f:
        json.dump({"validation_accuracy": accuracy, "confusion_matrix": matrix}, f, indent=2)

    # Fit the final model on all labelled rows after evaluating the hold-out split.
    final_model = build_model()
    final_model.fit(X, y)
    joblib.dump(final_model, "titanic_survival_model.joblib")
    print("\nSaved model to titanic_survival_model.joblib")
    print("Run the app with: streamlit run app.py")


if __name__ == "__main__":
    main()
