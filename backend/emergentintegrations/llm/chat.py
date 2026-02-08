# Mock LlmChat for development
class UserMessage:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

class LlmChat:
    def __init__(self, *args, **kwargs):
        self.messages = []
    
    async def call(self, *args, **kwargs):
        return "This is a mock response from the AI companion."
