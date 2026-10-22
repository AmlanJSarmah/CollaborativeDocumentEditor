from langchain.agents import create_agent
from langchain_ollama import ChatOllama

llm = ChatOllama(model="llama3.2:3b")

agent = create_agent(
    model=llm,
    system_prompt="You are a helpful assistant",
)

result = agent.invoke(
    {"messages": [{"role": "user", "content": "How are you doing today ?"}]}
)
print(result["messages"][-1].content_blocks)