# Build@Mercari HACKWEEK 2022

# Installation

### for backend
```
(cd python && pip install -r requirements.txt)
```
### for frontend
```
(cd typescript/simple-mercari-web && npm ci)
```

# Usage

### Starting backend
```
(cd python && uvicorn main:app --reload --port 9000)
```

### Starting frontend
```
(cd typescript/simple-mercari-web && npm start)
```