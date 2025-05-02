# SnapWort

SnapWort is a mobile-first web application that helps you learn languages by looking up word definitions in English and German using multiple AI models including OpenAI, Groq, and Mistral.

## Features

- Search for word definitions in English and German
- Get definitions powered by multiple AI models:
  - OpenAI's GPT-4o-mini
  - Groq's Llama-4-Scout-17B
  - Mistral's Small-3.1-24B-Instruct
- Choose your preferred AI model for responses
- Save words to your personal library for later reference
- Organize saved words by language
- Mobile-first responsive design

## Technologies Used

- Next.js 15
- TypeScript
- Tailwind CSS
- Dexie.js (IndexedDB)
- OpenAI API
- Groq API
- Mistral AI API

## Getting Started

### Prerequisites

- Node.js 18 or higher
- NPM or Yarn
- API keys for the models you want to use:
  - OpenAI API key
  - Groq API key
  - Mistral API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/snapwort.git
cd snapwort
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your API keys:
```
OPENAI_API_KEY=your_openai_api_key_here
GROQ_API_KEY=your_groq_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here

# Add any other required environment variables
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to use the application.

## Usage

1. Select a language (English or German) from the language selector
2. Choose your preferred AI model (OpenAI, Groq, or Mistral) from the model selector
3. Enter a word or phrase in the input field
4. Click "Search" to get the definition
5. The word and definition will be automatically saved to your library
6. Access your saved words by clicking on "Library" in the bottom navigation

## License

This project is licensed under the MIT License.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# snapwort2
