# RecViz: a visualiser for recommender systems and their datasets

## Installation Instructions

### Pre-requirements
- **Python 3.12**
- **Conda 24.11.2+**
- **For GPU acceleration**: Must have a **NVIDIA GPU** with **Volta/Turing architecture or newer**.
- **Windows without WSL2 is not supported**
### Setup Steps

#### 1. Backend Installation
- **For Linux or WSL2**:
  ```sh
  conda create --name <env_name> --file install/spec-file.txt
  conda activate <env_name>
  ```
- **For macOS**:
  ```sh
  python -m venv venv
  source venv/bin/activate
  pip install -r install/requirements.txt
  ```

#### 2. Frontend Installation
```sh
cd recviz-frontend
npm i
```

#### 3. Environment Setup
Create the following empty directories:
```sh
mkdir recviz_cache
mkdir recviz_datasets
```
Set the environment variables:
- **Linux/WSL2/macOS**:
  ```sh
  export RECVIZ_CACHE_PATH=$(pwd)/recviz_cache
  export RECVIZ_DS_PATH=$(pwd)/recviz_datasets
  ```

#### 4. Running the Application
- Start the backend:
  ```sh
  python manage.py runserver
  ```
- Start the frontend:
  ```sh
  cd recviz-frontend
  npm run dev
  ```

## Adding Dataset Files and Model Files

### Steps to Train and Prepare Models
1. Download RecBole's `run_recbole.py` script:
   ```
   wget https://github.com/RUCAIBox/RecBole/blob/master/run_recbole.py
   ```
2. Train a model using RecBole:
   ```sh
   python run_recbole.py --dataset <dataset_name>
   ```
3. Locate and copy the model checkpoint (`.pth`) from:
   ```sh
   [working directory]/saved/
   ```
4. Copy dataset atomic files from:
   ```sh
   [working directory]/dataset/<dataset_name>/
   ```

### Expected Folder Structure
```
recviz_datasets/
├── dataset_name/
│   ├── dataset_name.inter
│   ├── dataset_name.item
│   ├── dataset_name.user
│   ├── models/
│   │   ├── model_checkpoint.pth
```

