const Anthropic = require("@anthropic-ai/sdk");
const { insertConversation, updateConversation } = require("./dbService");
require("dotenv").config();

async function validateKey(key) {
  const testClient = new Anthropic({ apiKey: key });
  try {
    await testClient.messages.create({
      model: process.env.DEFAULT_MODEL,
      max_tokens: 10,
      temperature: 0,
      messages: [{ role: "user", content: "Hello" }],
    });
    console.log("Anthropic API key validated successfully");
    return true;
  } catch (error) {
    console.error("Error validating Anthropic API key:", error);
    return false;
  }
}

class AnthropicService {
  constructor({
    userId,
    apiKey,
    tokensUsed = 0,
    model = process.env.DEFAULT_MODEL,
    temperature = 0,
    maxTokens = 4000,
  }) {
    this.isCustomKey = !!apiKey;
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.apiKey = apiKey;
    this.tokensUsed = tokensUsed;
    this.userId = userId;
    this.conversationId;
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.startTimestamp = Date.now();
  }

  async sendMessage({ system, tools = [], tool_choice, messages = [] }) {
    if (messages.length < 1) {
      throw new Error("No messages provided");
    }
    const clientParams = {
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages,
      tools,
    };
    if (tool_choice) {
      clientParams.tool_choice = tool_choice;
    }
    if (system) {
      clientParams.system = system;
    }
    const response = await this.client.messages.create(clientParams);
    console.log("currently used tokens", this.tokensUsed);
    this.tokensUsed += response.usage.output_tokens;
    console.log("new tokens used", this.tokensUsed);

    if (!this.conversationId) {
      const conversation = await insertConversation({
        user_id: this.userId,
        chat_json: messages,
        tokens_used: this.tokensUsed,
      });
      this.conversationId = conversation.id;
      console.log("inserted conversation: ", this.conversationId);
    }
    // else { // disabling as we dont need to update it everytime
    //   console.log("updating conversation: ", this.conversationId);
    //   await updateConversation(this.conversationId, {
    //     chat_json: messages,
    //     tokens_used: this.tokensUsed,
    //   });
    // }

    return response;
  }

  static validateKey(key) {
    return validateKey(key);
  }
}

module.exports = { AnthropicService };