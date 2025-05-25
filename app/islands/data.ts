import { IslandsData } from './types';

export const ISLANDS_DATA: IslandsData = {
  transport: {
    id: 'transport',
    name: 'Transport Island',
    icon: '🚗',
    position: { x: 15, y: 25 },
    color: 'from-blue-500 to-cyan-500',
    description: 'Master transportation vocabulary and scenarios',
    subtopics: {
      daily_commute: {
        id: 'daily_commute',
        name: 'Daily Commute',
        icon: '🚌',
        questions: [
          {
            id: 1,
            title: "Your Daily Journey",
            question: "Describe your daily commute to work or school. What transportation do you use and why?",
            hints: ["Mention the type of transport", "Talk about duration", "Explain your choice"],
            vocabulary: [
              { type: "phrase", text: "I usually take the...", meaning: "Common way to start describing routine transport" },
              { type: "expression", text: "It takes about... minutes", meaning: "Describing duration" },
              { type: "vocabulary", text: "rush hour", meaning: "Peak traffic time" },
              { type: "vocabulary", text: "reliable/unreliable", meaning: "Can be trusted or not" },
              { type: "phrase", text: "I prefer... because...", meaning: "Expressing preference with reason" },
              { type: "vocabulary", text: "convenient", meaning: "Easy and suitable" },
              { type: "expression", text: "door-to-door", meaning: "From start to end point directly" },
              { type: "vocabulary", text: "crowded/packed", meaning: "Full of people" }
            ]
          },
          {
            id: 2,
            title: "Commute Challenges",
            question: "What challenges do you face during your daily commute and how do you deal with them?",
            hints: ["Describe specific problems", "Explain your solutions", "Talk about alternatives"],
            vocabulary: [
              { type: "vocabulary", text: "traffic jam/gridlock", meaning: "Heavy traffic that doesn't move" },
              { type: "expression", text: "running late", meaning: "Behind schedule" },
              { type: "phrase", text: "I have to deal with...", meaning: "Explaining problems you face" },
              { type: "vocabulary", text: "delays", meaning: "Things taking longer than expected" },
              { type: "phrase", text: "To avoid this, I...", meaning: "Explaining solutions" },
              { type: "vocabulary", text: "alternative route", meaning: "Different way to go" }
            ]
          }
        ]
      },
      public_transport: {
        id: 'public_transport',
        name: 'Public Transport',
        icon: '🚊',
        questions: [
          {
            id: 3,
            title: "At the Train Station",
            question: "You're at a train station and need to buy a ticket to London. What would you say to the ticket officer?",
            hints: ["Be polite", "Specify destination", "Ask about times and prices"],
            vocabulary: [
              { type: "phrase", text: "I'd like a ticket to...", meaning: "Polite way to request a ticket" },
              { type: "vocabulary", text: "single/return ticket", meaning: "One-way or round-trip" },
              { type: "expression", text: "What time does the next train leave?", meaning: "Asking about departure times" },
              { type: "vocabulary", text: "platform", meaning: "Where trains stop at stations" },
              { type: "phrase", text: "How much does it cost?", meaning: "Asking about price" },
              { type: "vocabulary", text: "off-peak/peak hours", meaning: "Cheaper/more expensive travel times" },
              { type: "expression", text: "Is this seat taken?", meaning: "Asking if you can sit somewhere" }
            ]
          },
          {
            id: 4,
            title: "Bus Experience",
            question: "Describe your experience using public buses. How do you navigate the system?",
            hints: ["Buying tickets", "Reading schedules", "Finding stops"]
          }
        ]
      },
      traffic_solutions: {
        id: 'traffic_solutions',
        name: 'Traffic & Solutions',
        icon: '🚦',
        questions: [
          {
            id: 5,
            title: "Traffic Problems",
            question: "What do you think is the best way to reduce traffic congestion in cities?",
            hints: ["Consider public transport", "Think about environmental impact", "Mention practical solutions"]
          },
          {
            id: 6,
            title: "Airport Security",
            question: "Describe your experience going through airport security. What steps are involved?",
            hints: ["Security procedures", "Personal belongings", "Common phrases used"]
          }
        ]
      }
    }
  },
  food: {
    id: 'food',
    name: 'Food Island',
    icon: '🍽️',
    position: { x: 70, y: 40 },
    color: 'from-orange-500 to-red-500',
    description: 'Explore culinary conversations and dining experiences',
    subtopics: {
      home_cooking: {
        id: 'home_cooking',
        name: 'Home Cooking',
        icon: '👨‍🍳',
        questions: [
          {
            id: 1,
            title: "Favorite Dish",
            question: "Describe your favorite dish from your country. How is it prepared?",
            hints: ["Name the dish", "List main ingredients", "Explain cooking method"]
          },
          {
            id: 2,
            title: "Cooking Experience",
            question: "Tell me about a time when you tried to cook something new. How did it go?",
            hints: ["Describe the recipe", "Explain challenges", "Share the outcome"]
          }
        ]
      },
      dining_out: {
        id: 'dining_out',
        name: 'Dining Out',
        icon: '🍴',
        questions: [
          {
            id: 3,
            title: "Restaurant Order",
            question: "You're ordering food at a restaurant. The waiter asks for your order. What do you say?",
            hints: ["Be polite", "Ask questions about the menu", "Specify preferences"]
          },
          {
            id: 4,
            title: "Special Dietary Needs",
            question: "How would you explain your dietary restrictions or allergies to a waiter?",
            hints: ["Be clear about restrictions", "Ask about ingredients", "Suggest alternatives"]
          }
        ]
      },
      food_culture: {
        id: 'food_culture',
        name: 'Food Culture',
        icon: '🌍',
        questions: [
          {
            id: 5,
            title: "Cultural Food Differences",
            question: "Compare the food culture in your country with another country you know well.",
            hints: ["Eating habits", "Popular dishes", "Meal times and customs"]
          }
        ]
      }
    }
  },
  travel: {
    id: 'travel',
    name: 'Travel Island',
    icon: '✈️',
    position: { x: 40, y: 65 },
    color: 'from-purple-500 to-pink-500',
    description: 'Navigate travel situations and share adventures',
    subtopics: {
      travel_experiences: {
        id: 'travel_experiences',
        name: 'Travel Experiences',
        icon: '🗺️',
        questions: [
          {
            id: 1,
            title: "Memorable Trip",
            question: "Tell me about the most memorable trip you've ever taken. What made it special?",
            hints: ["Describe the destination", "Share specific experiences", "Explain why it was memorable"]
          },
          {
            id: 2,
            title: "Cultural Shock",
            question: "Describe a time when you experienced culture shock while traveling. How did you adapt?",
            hints: ["Specific cultural differences", "Your initial reaction", "How you adjusted"]
          }
        ]
      },
      travel_planning: {
        id: 'travel_planning',
        name: 'Travel Planning',
        icon: '📋',
        questions: [
          {
            id: 3,
            title: "Planning Process",
            question: "How do you usually plan for a trip? What factors do you consider?",
            hints: ["Budget considerations", "Research methods", "Booking preferences"]
          },
          {
            id: 4,
            title: "Travel Budget",
            question: "How do you manage your budget when traveling? What are your money-saving tips?",
            hints: ["Budget planning", "Cost-cutting strategies", "Expense tracking"]
          }
        ]
      },
      travel_problems: {
        id: 'travel_problems',
        name: 'Travel Problems',
        icon: '⚠️',
        questions: [
          {
            id: 5,
            title: "Hotel Problem",
            question: "You're checking into a hotel and there's a problem with your reservation. How do you handle it?",
            hints: ["Stay calm and polite", "Explain the situation clearly", "Ask for solutions"]
          },
          {
            id: 6,
            title: "Lost Luggage",
            question: "Your luggage is lost at the airport. Describe how you would handle this situation.",
            hints: ["Report to airline staff", "Describe your luggage", "Ask about compensation"]
          }
        ]
      }
    }
  }
} as const;
