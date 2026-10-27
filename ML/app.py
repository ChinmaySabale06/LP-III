import os
import joblib
import pandas as pd
import streamlit as st

MODEL_PATH = "titanic_survival_model.joblib"
st.set_page_config(page_title="Titanic Survival Predictor", page_icon="🚢")
st.title("🚢 Titanic Survival Predictor")
st.write("Enter passenger details to see the model's prediction. This is an educational demo, not a historical certainty.")

if not os.path.exists(MODEL_PATH):
    st.warning("Model file not found. First run `python train_model.py`.")
    st.stop()

model = joblib.load(MODEL_PATH)
with st.form("passenger_form"):
    left, right = st.columns(2)
    with left:
        pclass = st.selectbox("Passenger class", [1, 2, 3], index=2)
        sex = st.selectbox("Gender", ["female", "male"])
        age = st.slider("Age", 0, 80, 25)
        fare = st.number_input("Ticket fare", min_value=0.0, max_value=600.0, value=32.0)
    with right:
        embarked = st.selectbox("Port of embarkation", ["S", "C", "Q"], index=0,
                                help="S = Southampton, C = Cherbourg, Q = Queenstown")
        title = st.selectbox("Title in name", ["Mr", "Mrs", "Miss", "Master", "Dr", "Rev", "Rare"])
        sibsp = st.number_input("Siblings/spouses aboard", min_value=0, max_value=10, value=0)
        parch = st.number_input("Parents/children aboard", min_value=0, max_value=10, value=0)
    submitted = st.form_submit_button("Predict survival")

if submitted:
    family_size = int(sibsp + parch + 1)
    row = pd.DataFrame([{
        "Pclass": pclass, "Sex": sex, "Age": age, "Fare": fare,
        "Embarked": embarked, "Title": title, "FamilySize": family_size,
        "IsAlone": int(family_size == 1),
    }])
    prediction = int(model.predict(row)[0])
    classes = list(model.named_steps["classifier"].classes_)
    survival_probability = float(model.predict_proba(row)[0][classes.index(1)])
    if prediction == 1:
        st.success(f"Prediction: Survived — estimated probability {survival_probability:.1%}")
    else:
        st.error(f"Prediction: Did not survive — estimated survival probability {survival_probability:.1%}")
    st.caption("The model learns patterns from historical passenger data. It can make mistakes.")
