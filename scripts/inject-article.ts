import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const articleContent = `## Introduction

Indoor positioning remains one of the most challenging problems in location-based services. While GPS works effectively outdoors, its signals become unreliable inside buildings due to attenuation caused by walls, floors, furniture, and other obstacles. As a result, applications such as indoor navigation, asset tracking, patient monitoring, and smart campus management require alternative localization technologies.

To address this challenge, we developed a low-cost Indoor Positioning System (IPS) that combines Wi-Fi fingerprinting, automated IoT-based data collection, and a Dynamic Stacking Machine Learning Ensemble. The system achieved an average localization accuracy of approximately **1.6 meters** while remaining lightweight enough to run on edge devices such as smartphones and Raspberry Pi systems.

Unlike many existing solutions that rely on expensive hardware or computationally intensive deep learning models, our approach focuses on affordability, scalability, and real-world deployment.

---

# Background

Indoor localization using Wi-Fi Received Signal Strength Indicator (RSSI) values has been an active research area for more than two decades. One of the earliest and most influential systems, RADAR, demonstrated that Wi-Fi fingerprints could be used to estimate indoor positions. However, such systems typically suffered from localization errors of **2–5 meters** and required extensive manual site surveys.

Recent research has explored advanced approaches such as:

- Deep Neural Networks (DNNs)
- Convolutional Neural Networks (CNNs)
- Recurrent Neural Networks (RNNs)
- LSTM-based localization systems

Although these methods often improve accuracy, they introduce several practical challenges:

- High computational requirements
- Large training datasets
- Poor suitability for edge devices
- Time-consuming data collection processes
- High deployment costs

These limitations motivated us to design a solution capable of delivering high accuracy while remaining lightweight, cost-effective, and easy to deploy.

---

# Methodology

## 1. Automated Data Collection

The first challenge was creating a high-quality RSSI fingerprint dataset.

Traditional fingerprinting systems require researchers to manually move throughout a building and record RSSI values at every location. This process is labor-intensive and difficult to scale.

To overcome this problem, we built an **ESP32-based Wi-Fi sniffer mounted on a robotic vehicle**. The robot was remotely controlled using a mobile application while continuously collecting RSSI measurements from nearby Wi-Fi access points.

The deployment area was divided into **3×3-foot virtual grids**, and at each grid location:

- RSSI values were collected
- X-Y coordinates were recorded
- Data was transmitted to a Raspberry Pi server using MQTT

This automation significantly reduced human effort while increasing dataset consistency and coverage.

---

## 2. Data Preprocessing

Raw RSSI data collected from Wi-Fi networks is often noisy and incomplete.

The collected dataset contained:

- **4,277 raw RSSI records**
- **209 unique Wi-Fi access points**
- **232 unique location samples**

To prepare the data for machine learning:

1. RSSI readings were grouped based on timestamp and location.
2. Data was transformed into a fingerprint matrix.
3. Each row represented a location sample.
4. Each column represented a Wi-Fi access point.
5. Missing RSSI values were replaced with a minimum signal value.
6. The dataset was split into training and testing sets using an 80:20 ratio.

The resulting fingerprint database provided a structured representation of the indoor environment.

---

## 3. Evaluating Multiple Machine Learning Models

Indoor localization was formulated as a **multi-output regression problem**, where the model predicts the X and Y coordinates of the user.

Several machine learning algorithms were evaluated:

- Ridge Regression
- Lasso Regression
- Support Vector Regression (SVR)
- Multi-Layer Perceptron (MLP)
- Artificial Neural Network (ANN)
- K-Nearest Neighbors (KNN)
- Random Forest
- XGBoost

Each model was trained and benchmarked using standard evaluation metrics:

- Mean Absolute Error (MAE)
- Mean Squared Error (MSE)
- Root Mean Squared Error (RMSE)
- R-Squared Score (R²)

Among all evaluated models, **KNN, Random Forest, and XGBoost consistently delivered the strongest performance**.

---

## 4. Dynamic Stacking Ensemble

Instead of selecting a single model, we combined the strengths of multiple models using a **Dynamic Stacking Ensemble** architecture.

### Base Learners

- K-Nearest Neighbors (KNN)
- Random Forest
- XGBoost

### Meta Learner

- Gradient Boosting Regressor

The prediction process works as follows:

1. RSSI fingerprints are provided to all three base models.
2. Each model generates its own coordinate prediction.
3. These predictions become inputs for a meta-model.
4. The Gradient Boosting Regressor learns how to optimally combine the outputs.
5. A final coordinate prediction is produced.

This architecture reduces individual model weaknesses while leveraging their complementary strengths.

As a result, prediction stability and localization accuracy improved significantly.

---

## 5. Cross-Building Validation

One common weakness of indoor positioning systems is overfitting to a specific environment.

To evaluate robustness, we tested our trained model in a completely different building with a different architectural layout and Wi-Fi environment.

The model was trained using data collected from:

**Pearl Research Park, VIT**

and validated using data collected from:

**G.D. Naidu Building, VIT**

Despite the environmental differences, the model maintained strong localization performance, demonstrating its ability to generalize beyond the original deployment environment.

---

# Results

## Performance Comparison

The performance of different machine learning models is summarized below.

| Model | MAE | RMSE | R² Score |
|---------|---------|---------|---------|
| Ridge | 4.515 | 6.566 | 0.740 |
| Lasso | 3.368 | 5.435 | 0.827 |
| SVR | 3.386 | 5.409 | 0.846 |
| XGBoost | 2.467 | 5.918 | 0.901 |
| KNN | 2.216 | 3.708 | 0.930 |
| Random Forest | 2.123 | 4.060 | 0.936 |
| Static Stacking | 1.569 | 1.975 | 0.974 |
| **Dynamic Stacking** | **1.468** | **1.787** | **0.978** |

### Key Achievements

- Mean Absolute Error (MAE): **1.468**
- Mean Squared Error (MSE): **3.193**
- Root Mean Squared Error (RMSE): **1.787**
- R² Score: **0.978**
- Approximate localization accuracy: **1.6 meters**

Compared to conventional Wi-Fi fingerprinting systems that typically achieve errors between **3 and 5 meters**, our Dynamic Stacking Ensemble reduced localization error by nearly **50%**.

The validation experiments conducted in an unseen building further confirmed the robustness and generalization capability of the proposed model.

---

# Conclusion

Achieving 1.6-meter indoor positioning accuracy required much more than selecting a powerful machine learning algorithm. The success of this project came from carefully optimizing every stage of the localization pipeline.

We automated RSSI fingerprint collection using an ESP32-based robotic platform, built a high-quality indoor radio map, applied effective preprocessing techniques, and combined the strengths of KNN, Random Forest, and XGBoost through a Dynamic Stacking Ensemble.

The final system achieved:

- RMSE of **1.787**
- R² Score of **0.978**
- Average positioning accuracy of approximately **1.6 meters**

while remaining lightweight enough for deployment on edge devices.

The successful validation in a completely different building demonstrated that the model is not merely memorizing a single environment but is capable of adapting to new indoor spaces.

This work shows that high-accuracy indoor localization does not necessarily require expensive infrastructure or deep neural networks. By combining automated data collection with an intelligent ensemble learning strategy, it is possible to build a scalable, cost-effective, and practical indoor positioning system suitable for real-world applications such as navigation, asset tracking, healthcare monitoring, smart campuses, and intelligent buildings.`;

async function main() {
  await prisma.article.update({
    where: { slug: 'indoor-positioning-ml-ensemble' },
    data: { content: articleContent }
  });
  console.log('Article successfully injected with preserved newlines!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
