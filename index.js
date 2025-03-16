require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const port = 3000;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
// Serve static files from the public directory
app.use(express.static('public'));



async function getStoreUrl(storeName) {
  const { findStoreUrl } = require('./hh-tools');
  return await findStoreUrl(storeName);
}

async function getProductUrl(storeUrl, productName) {
  const { findProductUrl } = require('./hh-tools');
  return await findProductUrl(storeUrl, productName);
}

// API endpoint to generate story
app.post('/search-product', async (req, res) => {
  // try {
    const tools = [{
      type: "function",
      name: "get_store_url",
      description: "Return the url of the store that sells the product",
      parameters: {
          type: "object",
          properties: {
              storeName: { type: "string" },
          },
          required: ["storeName"],
          additionalProperties: false
      },
      strict: true
  }, {
    type: "function",
    name: "get_product_url",
    description: "Return the url of the product",
    parameters: {
      type: "object",
      properties: {
        productName: { type: "string" },
        storeUrl: { type: "string" },
      },
      required: ["productName", "storeUrl"],
      additionalProperties: false
    },
    strict: true
  }];


    const input = [
      {
        role: "user",
        content: req.body.query //"Where can I buy things from the store called 'lasclay'?"
      }
    ];

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input,
      tools,
    });

    const toolCall = response.output[0];
    console.log('toolCall', toolCall);
    const args = JSON.parse(toolCall.arguments);
    const result = await getStoreUrl(args.storeName);

    input.push(toolCall); // append model's function call message
    input.push({                               // append result message
      type: "function_call_output",
      call_id: toolCall.call_id,
      output: result.toString()
    });

    console.log('result', result);

    const response2 = await openai.responses.create({
      model: "gpt-4o",
      input,
      tools,
      store: true,
    });

    const toolCall2 = response2.output[0];
    console.log('toolCall2', toolCall2);
    const args2 = JSON.parse(toolCall2.arguments);
    console.log('args2', args2);
    const result2 = await getProductUrl(args2.storeUrl, args2.productName);

    input.push(toolCall2); // append model's function call message
    input.push({                               // append result message
      type: "function_call_output",
      call_id: toolCall2.call_id,
      output: result2.toString()
    });

    const response3 = await openai.responses.create({
      model: "gpt-4o",
      input,
      tools,
      store: true,
    });

    res.json({
      story: response3.output_text
    });
  // } catch (error) {
  //   console.error('Error:', error.message);
  //   res.status(500).json({ error: 'Failed to generate story' });
  // }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
}); 