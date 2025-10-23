# Rainmaker AI

AI-powered content generator for Shopify stores. Automatically creates compelling sales pages and marketing content for products using advanced AI workflows.

## Features

- **AI Content Generation**: Leverages state of the art AI for intelligent product content creation
- **Shopify Integration**: Seamless connection with Shopify stores via Gadget framework
- **Webhook Processing**: Real-time content delivery through webhook endpoints
- **Product Metafields**: Automatic population of Shopify product metafields
- **Multi-format Support**: Generates structured content including sales pages, reviews, and marketing copy

## Tech Stack

- **Framework**: Gadget (TypeScript/React)
- **AI Service**: Custom AI workflows using dedicated API endpoints
- **E-commerce**: Shopify API
- **Frontend**: React with Vite
- **Backend**: Node.js with TypeScript
- **Database**: Gadget's built-in data layer

## Architecture

- **Global Actions**: `generateAiContent` and `generateAiContentFromUrl` for content generation
- **Webhook Handler**: Processes AI-generated content and updates Shopify products
- **Model Layer**: Manages generation jobs, AI content drafts, and metafields
- **Access Control**: Granular permissions for Shopify store data

## Installation

```bash
# Clone the repository
git clone https://github.com/arbaaz04/Shopify-AI-Pages-Maker.git

# Install dependencies
yarn install

# Configure environment variables
# Set AI_WORKFLOW_ENDPOINT, AI_API_KEY, GADGET_PUBLIC_APPLICATION_URL

# Deploy to Gadget
gadget deploy
```

## API Endpoints

- `POST /api/actions/generateAiContent` - Generate content from product description
- `POST /api/actions/generateAiContentFromUrl` - Generate content from product URL
- `POST /ai-webhook` - Receive AI-generated content from workflows

## Publishing Requirements

To publish generated pages, merchants need the **Zipify app** installed on their Shopify store. This app works in coordination with Zipify to seamlessly publish AI-generated content as landing pages.

## Data Models

- **shopifyShop**: Store Shopify shop information and credentials
- **generationJob**: Track AI content generation requests
- **aiContentDraft**: Store generated content before publication
- **metafields**: Manage Shopify product metafields

## Made by

**Arbaaz Murtaza** and **Safwan Adnan**  
*Scrptble* - Shopify Development Agency

Specializing in custom Shopify apps, headless commerce solutions, and AI-powered e-commerce tools. Available for freelance projects and custom development.

## Contact

- **Email**: info@scrptble.com
- **Website**: [scrptble.com](https://scrptble.com)
- **LinkedIn**: [Arbaaz Murtaza](https://www.linkedin.com/in/arbaaz-murtaza-bb6b21278/?originalSubdomain=pk) | [Safwan Adnan](https://www.linkedin.com/in/safwan-adnan/?originalSubdomain=pk)
