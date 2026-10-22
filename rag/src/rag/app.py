from fastapi import FastAPI

app = FastAPI()

@app.get('/health-status')
def helth_check():
    return {"message" : "status healthy"}