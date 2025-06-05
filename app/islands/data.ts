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
            sampleAnswer: "I usually take the metro to work because it's the most reliable option during rush hour. The journey takes about 25 minutes door-to-door, and I can read or catch up on emails while traveling. I prefer public transport over driving because parking is expensive downtown, and the metro runs frequently during peak hours. On days when the weather is nice, I sometimes cycle part of the way, which helps me get some exercise before starting my workday.",
            hints: [
              "Start by mentioning your main mode of transport (bus, train, car, bike, walking)",
              "Explain the duration and describe the typical journey",
              "Give reasons for your choice (cost, convenience, reliability, environment)",
              "Mention any variations (different transport in bad weather, backup options)"
            ],
            vocabulary: [
              { type: "phrase", text: "I usually take the...", meaning: "Common way to start describing routine transport" },
              { type: "expression", text: "It takes about... minutes", meaning: "Describing duration" },
              { type: "vocabulary", text: "rush hour", meaning: "Peak traffic time" },
              { type: "vocabulary", text: "reliable/unreliable", meaning: "Can be trusted or not" },
              { type: "phrase", text: "I prefer... because...", meaning: "Expressing preference with reason" },
              { type: "vocabulary", text: "convenient", meaning: "Easy and suitable" },
              { type: "expression", text: "door-to-door", meaning: "From start to end point directly" },
              { type: "vocabulary", text: "crowded/packed", meaning: "Full of people" }
            ],
            vocabularyHints: [
              {
                category: "Transport Options",
                expressions: [
                  "take the bus/train/metro/subway",
                  "drive to work",
                  "cycle/bike to the office",
                  "walk part of the way",
                  "carpool with colleagues",
                  "use ride-sharing apps",
                  "take a taxi/Uber"
                ]
              },
              {
                category: "Journey Description",
                expressions: [
                  "door-to-door journey",
                  "It takes approximately...",
                  "The commute is about... minutes",
                  "I have to change trains/buses",
                  "direct route to...",
                  "make a connection at...",
                  "it's a straight shot to..."
                ]
              },
              {
                category: "Reasons and Preferences",
                expressions: [
                  "it's the most convenient option",
                  "more reliable than driving",
                  "avoid traffic congestion",
                  "parking is expensive/limited",
                  "environmentally friendly choice",
                  "cost-effective in the long run",
                  "allows me to read/work while traveling"
                ]
              },
              {
                category: "Time and Frequency",
                expressions: [
                  "during peak/rush hours",
                  "off-peak travel times",
                  "runs every 5-10 minutes",
                  "frequent service throughout the day",
                  "the morning/evening rush",
                  "avoid the busiest times"
                ]
              }
            ]
          },
          {
            id: 2,
            title: "Commute Challenges",
            question: "What challenges do you face during your daily commute and how do you deal with them?",
            sampleAnswer: "The main challenge I face is getting stuck in traffic jams during rush hour, which can add an extra 20-30 minutes to my journey. To deal with this, I've developed a few strategies. I use traffic apps like Google Maps to check real-time conditions and find alternative routes when necessary. I also try to leave home about 15 minutes earlier than I need to, which helps reduce stress if there are unexpected delays. When I do get caught in heavy traffic, I make the most of the time by listening to podcasts or audiobooks, so I don't feel like the time is completely wasted.",
            hints: [
              "Identify specific problems you encounter (traffic, delays, overcrowding, cost)",
              "Describe how these issues affect your journey or mood",
              "Explain the practical solutions you've found or strategies you use",
              "Mention any backup plans or alternatives you have"
            ],
            vocabulary: [
              { type: "vocabulary", text: "traffic jam/gridlock", meaning: "Heavy traffic that doesn't move" },
              { type: "expression", text: "running late", meaning: "Behind schedule" },
              { type: "phrase", text: "I have to deal with...", meaning: "Explaining problems you face" },
              { type: "vocabulary", text: "delays", meaning: "Things taking longer than expected" },
              { type: "phrase", text: "To avoid this, I...", meaning: "Explaining solutions" },
              { type: "vocabulary", text: "alternative route", meaning: "Different way to go" }
            ],
            vocabularyHints: [
              {
                category: "Describing Traffic Problems",
                expressions: [
                  "get stuck in traffic jams",
                  "heavy/bumper-to-bumper traffic",
                  "rush hour congestion",
                  "unpredictable traffic conditions",
                  "road construction delays",
                  "traffic comes to a standstill",
                  "crawling along at a snail's pace"
                ]
              },
              {
                category: "Public Transport Issues",
                expressions: [
                  "overcrowded buses/trains",
                  "packed like sardines",
                  "unreliable public transport",
                  "delays and cancellations",
                  "miss my connection",
                  "standing room only",
                  "peak/off-peak hours"
                ]
              },
              {
                category: "Time-Related Expressions",
                expressions: [
                  "running late for work",
                  "add an extra 20 minutes to my journey",
                  "arrive at the office behind schedule",
                  "plan my departure time carefully",
                  "allow extra time for delays",
                  "time my commute to avoid..."
                ]
              },
              {
                category: "Coping Strategies",
                expressions: [
                  "I've developed a few strategies",
                  "make the most of my commuting time",
                  "listen to podcasts/audiobooks",
                  "use traffic apps to check real-time conditions",
                  "find alternative routes",
                  "leave home earlier than necessary",
                  "travel at off-peak times when possible"
                ]
              },
              {
                category: "Emotional Responses",
                expressions: [
                  "it can be quite frustrating when...",
                  "find it stressful/exhausting",
                  "try not to let it ruin my mood",
                  "stay calm and patient",
                  "see it as an opportunity to...",
                  "learn to accept that delays happen"
                ]
              },
              {
                category: "Linking and Organizing Ideas",
                expressions: [
                  "The main challenge I face is...",
                  "Another issue I regularly encounter...",
                  "As for how I deal with this...",
                  "What I've found helpful is...",
                  "The key is really about..."
                ]
              }
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
            sampleAnswer: "Good morning. I'd like a return ticket to London, please. What time does the next train leave? And could you tell me how much it costs? I'm wondering if there are any off-peak discounts available, as I'm flexible with my travel time. Also, which platform does the train depart from, and do I need to reserve a seat, or is it first-come, first-served?",
            hints: [
              "Start with a polite greeting and clearly state your destination",
              "Specify if you want a single or return ticket",
              "Ask about departure times, prices, and any available discounts",
              "Inquire about platform information and seat reservations"
            ],
            vocabulary: [
              { type: "phrase", text: "I'd like a ticket to...", meaning: "Polite way to request a ticket" },
              { type: "vocabulary", text: "single/return ticket", meaning: "One-way or round-trip" },
              { type: "expression", text: "What time does the next train leave?", meaning: "Asking about departure times" },
              { type: "vocabulary", text: "platform", meaning: "Where trains stop at stations" },
              { type: "phrase", text: "How much does it cost?", meaning: "Asking about price" },
              { type: "vocabulary", text: "off-peak/peak hours", meaning: "Cheaper/more expensive travel times" },
              { type: "expression", text: "Is this seat taken?", meaning: "Asking if you can sit somewhere" }
            ],
            vocabularyHints: [
              {
                category: "Ticket Requests",
                expressions: [
                  "I'd like a ticket to...",
                  "Could I have a return ticket to...?",
                  "I need a single/one-way ticket",
                  "What's the cheapest option to...?",
                  "Are there any discounts available?",
                  "Do you have any off-peak tickets?",
                  "I'd prefer to travel in first/second class"
                ]
              },
              {
                category: "Time and Schedule Inquiries",
                expressions: [
                  "What time does the next train leave?",
                  "When's the last train to...?",
                  "How long does the journey take?",
                  "Are there any direct trains?",
                  "Do I need to change trains?",
                  "What time does it arrive in...?",
                  "How frequent are the trains?"
                ]
              },
              {
                category: "Platform and Practical Information",
                expressions: [
                  "Which platform does it leave from?",
                  "Where can I find platform 5?",
                  "Do I need to reserve a seat?",
                  "Is it first-come, first-served?",
                  "Where's the waiting area?",
                  "Are there any delays today?",
                  "Is the train running on time?"
                ]
              },
              {
                category: "Payment and Booking",
                expressions: [
                  "How much does that cost?",
                  "Can I pay by card?",
                  "Do you take contactless payment?",
                  "Could I get a receipt, please?",
                  "Is there a booking fee?",
                  "Can I change this ticket later?",
                  "What's your cancellation policy?"
                ]
              },
              {
                category: "Polite Conversation",
                expressions: [
                  "Good morning/afternoon",
                  "Excuse me, could you help me?",
                  "Thank you very much",
                  "That's perfect, thank you",
                  "I appreciate your help",
                  "Have a great day",
                  "Sorry, could you repeat that?"
                ]
              }
            ]
          },
          {
            id: 4,
            title: "Bus Experience",
            question: "Describe your experience using public buses. How do you navigate the system?",
            sampleAnswer: "Using the bus system took some getting used to, but I've learned to navigate it quite well. First, I download the local transport app to check routes and real-time arrivals, which helps me plan my journey and avoid long waits. I usually buy a weekly or monthly pass because it's more economical than paying per trip. The key is understanding the route numbers and knowing which direction you need to go. I always check the destination display on the front of the bus before boarding. During rush hour, buses can get very crowded, so I try to move toward the back to make room for other passengers. I've found that having exact change or a transit card makes boarding much smoother.",
            hints: [
              "Describe how you learned to use the bus system",
              "Mention tools or apps that help you navigate routes and schedules",
              "Explain your ticket/payment strategy and why it works for you",
              "Share tips about boarding, finding seats, and bus etiquette during busy times"
            ],
            vocabularyHints: [
              {
                category: "Navigation and Planning",
                expressions: [
                  "check the bus routes",
                  "download the transport app",
                  "plan my journey in advance",
                  "check real-time arrivals",
                  "figure out the route numbers",
                  "understand the bus network",
                  "know which direction to go"
                ]
              },
              {
                category: "Tickets and Payment",
                expressions: [
                  "buy a day/weekly/monthly pass",
                  "more economical than single tickets",
                  "tap my transit card",
                  "have exact change ready",
                  "pay the driver directly",
                  "validate my ticket",
                  "show my student discount"
                ]
              },
              {
                category: "Boarding and Riding",
                expressions: [
                  "wait at the bus stop",
                  "signal the bus to stop",
                  "check the destination display",
                  "board through the front door",
                  "move toward the back",
                  "offer my seat to elderly passengers",
                  "press the stop button"
                ]
              },
              {
                category: "Common Challenges",
                expressions: [
                  "buses can get very crowded",
                  "packed during rush hour",
                  "difficult to find a seat",
                  "long waits between buses",
                  "buses running behind schedule",
                  "confusing route changes",
                  "missed my stop"
                ]
              },
              {
                category: "Learning and Adapting",
                expressions: [
                  "took some getting used to",
                  "learned through trial and error",
                  "gradually became more confident",
                  "asked other passengers for help",
                  "observed how locals do it",
                  "made a few mistakes at first",
                  "now I'm quite comfortable with it"
                ]
              }
            ]
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
            sampleAnswer: "I believe the most effective approach is to improve and expand public transportation systems. When people have reliable, frequent, and affordable alternatives to driving, many will choose to leave their cars at home. Cities should also implement congestion pricing in downtown areas, where drivers pay a fee to enter during peak hours. This has worked well in London and Singapore. Additionally, promoting flexible working arrangements like remote work and staggered office hours can help spread out travel times and reduce rush hour traffic. Finally, investing in cycling infrastructure and making cities more walkable gives people even more options for getting around without cars.",
            hints: [
              "Present your main solution and explain why it would be effective",
              "Give examples of cities that have successfully implemented similar measures",
              "Consider multiple approaches: infrastructure, policy, and behavioral changes",
              "Discuss both short-term and long-term benefits of your proposed solutions"
            ],
            vocabularyHints: [
              {
                category: "Public Transport Solutions",
                expressions: [
                  "improve and expand public transportation",
                  "reliable and frequent service",
                  "affordable alternatives to driving",
                  "invest in metro/subway systems",
                  "increase bus frequency",
                  "create dedicated bus lanes",
                  "integrate different transport modes"
                ]
              },
              {
                category: "Policy and Pricing Measures",
                expressions: [
                  "implement congestion pricing",
                  "charge fees for city center access",
                  "introduce car-free zones",
                  "restrict private vehicle access",
                  "implement odd-even license plate systems",
                  "increase parking fees",
                  "provide park-and-ride facilities"
                ]
              },
              {
                category: "Work and Lifestyle Changes",
                expressions: [
                  "promote flexible working arrangements",
                  "encourage remote work options",
                  "stagger office hours",
                  "spread out travel times",
                  "reduce peak hour demand",
                  "offer compressed work weeks",
                  "support work-from-home policies"
                ]
              },
              {
                category: "Infrastructure Improvements",
                expressions: [
                  "invest in cycling infrastructure",
                  "create bike-friendly cities",
                  "build more pedestrian walkways",
                  "improve road capacity",
                  "optimize traffic light timing",
                  "construct bypass roads",
                  "develop integrated transport hubs"
                ]
              },
              {
                category: "Examples and Evidence",
                expressions: [
                  "this has worked well in...",
                  "cities like London and Singapore",
                  "studies have shown that...",
                  "successful examples include...",
                  "research indicates that...",
                  "evidence from other cities suggests...",
                  "pilot programs have demonstrated..."
                ]
              },
              {
                category: "Benefits and Outcomes",
                expressions: [
                  "reduce air pollution and emissions",
                  "improve quality of life",
                  "make cities more livable",
                  "decrease travel times",
                  "lower transportation costs",
                  "create more sustainable urban mobility",
                  "benefit both the environment and economy"
                ]
              }
            ]
          },
          {
            id: 6,
            title: "Airport Security",
            question: "Describe your experience going through airport security. What steps are involved?",
            sampleAnswer: "Going through airport security has become quite a routine for me, though it can still be time-consuming. First, I make sure to arrive at the airport early and have all my documents ready - passport, boarding pass, and any necessary travel documents. At the security checkpoint, I place my liquids in a clear plastic bag and put electronics larger than a phone in separate trays. I remove my shoes, belt, and jacket, and place everything in the plastic bins. After walking through the metal detector or body scanner, I wait to collect my belongings. Occasionally, they'll do a random additional check or test my hands for chemical residues. The whole process usually takes about 10-15 minutes, but it can be longer during busy travel periods.",
            hints: [
              "Describe the preparation steps you take before reaching security",
              "Explain the process of putting items through X-ray machines and scanners",
              "Mention what clothing and items you need to remove",
              "Talk about any additional checks or procedures you've experienced"
            ],
            vocabularyHints: [
              {
                category: "Pre-Security Preparation",
                expressions: [
                  "arrive at the airport early",
                  "have documents ready",
                  "check-in online beforehand",
                  "print boarding passes",
                  "organize carry-on luggage",
                  "separate liquids and electronics",
                  "empty water bottles"
                ]
              },
              {
                category: "Security Checkpoint Process",
                expressions: [
                  "approach the security checkpoint",
                  "show boarding pass and ID",
                  "place items in plastic bins",
                  "put electronics in separate trays",
                  "remove shoes, belt, and jacket",
                  "walk through the metal detector",
                  "raise arms for body scanner"
                ]
              },
              {
                category: "Items and Restrictions",
                expressions: [
                  "liquids in containers under 100ml",
                  "place in clear plastic bags",
                  "electronics larger than a phone",
                  "laptops and tablets separately",
                  "remove metallic items",
                  "prohibited items list",
                  "sharp objects not allowed"
                ]
              },
              {
                category: "Additional Checks",
                expressions: [
                  "random additional screening",
                  "manual bag inspection",
                  "pat-down search",
                  "test hands for chemical residues",
                  "explosive detection swab",
                  "additional questioning",
                  "secondary security screening"
                ]
              },
              {
                category: "Time and Efficiency",
                expressions: [
                  "the whole process takes about...",
                  "can be time-consuming during busy periods",
                  "long queues during peak hours",
                  "move through security quickly",
                  "be patient during busy times",
                  "allow extra time for security",
                  "priority lanes for frequent travelers"
                ]
              },
              {
                category: "After Security",
                expressions: [
                  "collect belongings from trays",
                  "reorganize carry-on luggage",
                  "put shoes and belt back on",
                  "proceed to departure gate",
                  "duty-free shopping area",
                  "wait in departure lounge",
                  "check flight status"
                ]
              }
            ]
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
            sampleAnswer: "My favorite dish from my country is beef stew with dumplings. It's a hearty, traditional meal that's perfect for cold weather. To prepare it, you start by browning chunks of beef in a large pot with some oil. Then you add chopped onions, carrots, and celery, cooking them until they're soft. After that, you pour in beef stock and add herbs like thyme and bay leaves. The stew needs to simmer slowly for about two hours until the meat becomes tender. About 30 minutes before serving, you add the dumplings, which are made from flour, butter, and milk. The result is a rich, comforting meal that fills the whole house with amazing aromas.",
            hints: [
              "Name the dish and explain why it's special to you or your culture",
              "Describe the main ingredients and their preparation",
              "Explain the cooking method and approximate cooking times",
              "Mention what makes this dish unique or traditional in your country"
            ],
            vocabularyHints: [
              {
                category: "Describing the Dish",
                expressions: [
                  "my favorite dish is...",
                  "a traditional/classic dish from...",
                  "it's a hearty/light meal",
                  "perfect for cold/hot weather",
                  "comfort food at its best",
                  "a dish that's been in my family for generations",
                  "represents the essence of our cuisine"
                ]
              },
              {
                category: "Main Ingredients",
                expressions: [
                  "the main ingredients include...",
                  "you'll need fresh/dried herbs",
                  "requires high-quality meat/vegetables",
                  "seasoned with salt, pepper, and...",
                  "made with locally sourced ingredients",
                  "the secret ingredient is...",
                  "traditional spices like..."
                ]
              },
              {
                category: "Preparation Methods",
                expressions: [
                  "start by chopping/dicing the vegetables",
                  "brown the meat in hot oil",
                  "sauté the onions until translucent",
                  "marinate the meat for several hours",
                  "slice ingredients thinly/thickly",
                  "peel and cube the potatoes",
                  "prepare all ingredients beforehand"
                ]
              },
              {
                category: "Cooking Process",
                expressions: [
                  "simmer slowly for two hours",
                  "cook on low/medium/high heat",
                  "stir occasionally to prevent sticking",
                  "cover the pot and let it cook",
                  "add ingredients gradually",
                  "season to taste throughout cooking",
                  "cook until the meat is tender"
                ]
              },
              {
                category: "Final Results",
                expressions: [
                  "the result is a rich, flavorful dish",
                  "fills the house with amazing aromas",
                  "creates a satisfying and nutritious meal",
                  "brings out the natural flavors",
                  "has a perfect balance of tastes",
                  "melts in your mouth",
                  "best served hot with..."
                ]
              }
            ]
          },
          {
            id: 2,
            title: "Cooking Experience",
            question: "Tell me about a time when you tried to cook something new. How did it go?",
            sampleAnswer: "Last month, I decided to try making homemade pasta from scratch for the first time. I'd always bought pasta from the store, but I wanted to challenge myself. I watched several YouTube tutorials and gathered all the ingredients - just flour, eggs, and a pinch of salt, which seemed simple enough. However, getting the dough consistency right was much harder than I expected. My first attempt was too dry and kept cracking when I tried to roll it out. I had to add more eggs and knead it for much longer than I thought. The rolling process was also quite challenging without a pasta machine. Despite the difficulties, the final result was absolutely delicious - much more flavorful than store-bought pasta. It took me nearly three hours from start to finish, but I was really proud of what I accomplished and definitely plan to make it again.",
            hints: [
              "Choose a specific dish you attempted and explain why you wanted to try it",
              "Describe the preparation process and any research you did beforehand",
              "Explain the challenges you encountered and how you tried to solve them",
              "Share the final outcome and what you learned from the experience"
            ],
            vocabularyHints: [
              {
                category: "Initial Motivation",
                expressions: [
                  "I decided to try making...",
                  "wanted to challenge myself",
                  "had always wanted to learn how to...",
                  "inspired by a cooking show/recipe",
                  "thought it would be interesting to...",
                  "friends recommended that I try...",
                  "seemed like a good opportunity to..."
                ]
              },
              {
                category: "Preparation and Research",
                expressions: [
                  "watched several YouTube tutorials",
                  "looked up recipes online",
                  "read through the instructions carefully",
                  "gathered all the necessary ingredients",
                  "prepared all the equipment I'd need",
                  "made sure I had enough time",
                  "followed the recipe step by step"
                ]
              },
              {
                category: "Challenges and Problems",
                expressions: [
                  "getting the consistency right was difficult",
                  "much harder than I expected",
                  "ran into several problems",
                  "the dough was too dry/wet",
                  "couldn't get the technique right",
                  "took longer than anticipated",
                  "had to start over again"
                ]
              },
              {
                category: "Problem-Solving Attempts",
                expressions: [
                  "had to add more liquid/flour",
                  "tried a different approach",
                  "adjusted the temperature/timing",
                  "looked up solutions online",
                  "asked for advice from friends",
                  "experimented with different techniques",
                  "learned from my mistakes"
                ]
              },
              {
                category: "Final Results and Reflection",
                expressions: [
                  "despite the difficulties, it turned out...",
                  "the final result was absolutely delicious",
                  "much more flavorful than store-bought",
                  "really proud of what I accomplished",
                  "learned a lot from the experience",
                  "definitely plan to make it again",
                  "gained confidence in the kitchen"
                ]
              },
              {
                category: "Time and Effort",
                expressions: [
                  "took me nearly three hours",
                  "from start to finish",
                  "much more time-consuming than expected",
                  "required patience and persistence",
                  "worth the extra effort",
                  "now I understand why...",
                  "appreciate the skill involved"
                ]
              }
            ]
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
            sampleAnswer: "Good evening. Yes, I think I'm ready to order. For my starter, I'd like the Caesar salad, please. And for the main course, could I have the grilled salmon with roasted vegetables? I'm wondering, is the salmon cooked medium or well-done? Also, what kind of vegetables come with it? Oh, and could I get the sauce on the side, please? To drink, I'll have a glass of the house white wine. Actually, before I forget, do you have any specials tonight that you'd recommend?",
            hints: [
              "Start with a polite greeting and confirm you're ready to order",
              "Order systematically: starter, main course, drinks",
              "Ask questions about preparation, ingredients, or recommendations",
              "Make any special requests politely (sauce on side, cooking preferences)"
            ],
            vocabularyHints: [
              {
                category: "Starting the Order",
                expressions: [
                  "Yes, I think I'm ready to order",
                  "Could I have a few more minutes?",
                  "I'd like to start with...",
                  "For my starter/appetizer, I'll have...",
                  "Let me begin with...",
                  "I think I'll go with...",
                  "What would you recommend?"
                ]
              },
              {
                category: "Main Course Selection",
                expressions: [
                  "For the main course, I'd like...",
                  "I'll have the grilled/roasted/fried...",
                  "Could I get the... please?",
                  "I'm interested in the...",
                  "The... sounds good to me",
                  "I'll go with the chef's special",
                  "What's popular here?"
                ]
              },
              {
                category: "Questions About Food",
                expressions: [
                  "How is the salmon prepared?",
                  "Is it cooked medium or well-done?",
                  "What comes with that dish?",
                  "What vegetables are included?",
                  "Is it very spicy?",
                  "What's in the sauce?",
                  "How big are the portions?"
                ]
              },
              {
                category: "Special Requests",
                expressions: [
                  "Could I get the sauce on the side?",
                  "Can I substitute the rice for potatoes?",
                  "Is it possible to have it without...?",
                  "Could you make it less spicy?",
                  "Can I have extra vegetables?",
                  "I'd prefer it well-done, please",
                  "Could I get dressing on the side?"
                ]
              },
              {
                category: "Drinks and Beverages",
                expressions: [
                  "To drink, I'll have...",
                  "I'd like a glass of...",
                  "Could I see the wine list?",
                  "What soft drinks do you have?",
                  "I'll have water, please",
                  "What do you have on tap?",
                  "A bottle of sparkling water, please"
                ]
              },
              {
                category: "Additional Requests",
                expressions: [
                  "Do you have any specials tonight?",
                  "What would you recommend?",
                  "Before I forget, could I also...?",
                  "Is there anything you're particularly known for?",
                  "What's your signature dish?",
                  "Actually, could I change that to...?",
                  "And could we get some bread to start?"
                ]
              }
            ]
          },
          {
            id: 4,
            title: "Special Dietary Needs",
            question: "How would you explain your dietary restrictions or allergies to a waiter?",
            sampleAnswer: "Excuse me, I have a few dietary restrictions I need to mention before ordering. I'm vegetarian, so I don't eat any meat, fish, or poultry. Also, I have a severe nut allergy, particularly to peanuts and tree nuts, so it's really important that my food doesn't come into contact with any nuts during preparation. Could you please check with the kitchen about which dishes would be safe for me? I notice you have a vegetarian pasta dish - does that contain any nuts or is it prepared in the same area where nuts are used? I really appreciate your help with this, as it's quite serious for me. Also, if possible, could you let the kitchen know about my allergy so they can take extra precautions?",
            hints: [
              "Start by clearly stating that you have dietary restrictions or allergies",
              "Be specific about what you cannot eat and why it's important",
              "Ask the waiter to check with the kitchen about ingredients and preparation",
              "Express that you appreciate their help and explain the seriousness if it's an allergy"
            ],
            vocabularyHints: [
              {
                category: "Introducing Restrictions",
                expressions: [
                  "I have some dietary restrictions",
                  "I need to mention a few allergies",
                  "Before I order, I should tell you that...",
                  "I have to be careful about what I eat",
                  "There are certain foods I cannot have",
                  "I follow a specific diet",
                  "I have some food sensitivities"
                ]
              },
              {
                category: "Types of Restrictions",
                expressions: [
                  "I'm vegetarian/vegan",
                  "I don't eat meat, fish, or poultry",
                  "I'm lactose intolerant",
                  "I can't have gluten/wheat",
                  "I follow a kosher/halal diet",
                  "I'm on a low-sodium diet",
                  "I avoid processed foods"
                ]
              },
              {
                category: "Allergy Explanations",
                expressions: [
                  "I have a severe allergy to...",
                  "I'm allergic to nuts/shellfish/dairy",
                  "particularly sensitive to...",
                  "even small amounts can cause problems",
                  "it's really important that my food doesn't...",
                  "come into contact with...",
                  "it's quite serious for me"
                ]
              },
              {
                category: "Requests for Help",
                expressions: [
                  "Could you please check with the kitchen?",
                  "Which dishes would be safe for me?",
                  "Can you ask about the ingredients?",
                  "Is this prepared in the same area as...?",
                  "Could you let the kitchen know?",
                  "Can they take extra precautions?",
                  "I'd appreciate your help with this"
                ]
              },
              {
                category: "Asking About Specific Dishes",
                expressions: [
                  "Does this dish contain any...?",
                  "Is there any chance of cross-contamination?",
                  "What oil is this cooked in?",
                  "Are there any hidden ingredients?",
                  "Is this made with butter or oil?",
                  "Does the sauce have any dairy?",
                  "Are there nuts in the bread/dessert?"
                ]
              },
              {
                category: "Expressing Gratitude and Seriousness",
                expressions: [
                  "I really appreciate your help",
                  "Thank you for being so understanding",
                  "I'm grateful for your patience",
                  "This is quite important to me",
                  "I know it's extra work, but...",
                  "Your help means a lot",
                  "I feel much safer when..."
                ]
              }
            ]
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
            sampleAnswer: "The food culture in my home country, Germany, is quite different from what I experienced when I lived in Spain for a year. In Germany, we tend to have our main meal at lunchtime - usually a hearty, substantial dish with meat, potatoes, and vegetables. Dinner is often lighter, sometimes just bread with cold cuts and cheese, which we call 'Abendbrot.' In contrast, Spanish people eat their main meal much later in the day, typically around 2-3 PM for lunch and 9-10 PM for dinner. Spanish meals are also more social affairs - people take their time, enjoy multiple courses, and conversation is just as important as the food. Another big difference is the siesta culture in Spain, where many restaurants close in the afternoon, something that would be unthinkable in Germany where punctuality and regular meal times are highly valued. Both cultures appreciate good food, but the approach to timing and social aspects is completely different.",
            hints: [
              "Choose two specific countries and explain your connection to both",
              "Compare meal times, portion sizes, and the social aspects of eating",
              "Discuss different types of cuisine and cooking methods",
              "Explain how food fits into daily life and social customs in each culture"
            ],
            vocabularyHints: [
              {
                category: "Introducing the Comparison",
                expressions: [
                  "The food culture in my country is quite different from...",
                  "Having lived in both countries, I've noticed...",
                  "There are significant differences between...",
                  "Comparing these two cultures, I'd say...",
                  "One thing that really stands out is...",
                  "The contrast is particularly noticeable in...",
                  "What strikes me most is the difference in..."
                ]
              },
              {
                category: "Meal Times and Structure",
                expressions: [
                  "we tend to have our main meal at...",
                  "dinner is typically served around...",
                  "lunch is usually eaten between...",
                  "meal times are much more flexible/rigid",
                  "people eat much later/earlier than...",
                  "the eating schedule is completely different",
                  "breakfast/lunch/dinner consists of..."
                ]
              },
              {
                category: "Food Types and Preparation",
                expressions: [
                  "traditional cuisine focuses on...",
                  "typical dishes include...",
                  "cooking methods tend to emphasize...",
                  "ingredients are usually fresh/processed",
                  "spices and seasonings are used...",
                  "portion sizes are generally larger/smaller",
                  "street food culture is very popular/rare"
                ]
              },
              {
                category: "Social Aspects of Eating",
                expressions: [
                  "meals are more social affairs",
                  "people take their time eating",
                  "conversation is just as important as food",
                  "family meals are highly valued",
                  "eating alone is common/uncommon",
                  "business lunches are typical",
                  "food brings people together"
                ]
              },
              {
                category: "Cultural Values and Attitudes",
                expressions: [
                  "punctuality and regular meal times are valued",
                  "food is seen as fuel/pleasure",
                  "there's emphasis on healthy eating",
                  "fast food is popular/avoided",
                  "home cooking is preferred over restaurants",
                  "food waste is considered unacceptable",
                  "hospitality is expressed through food"
                ]
              },
              {
                category: "Drawing Conclusions",
                expressions: [
                  "Both cultures appreciate good food, but...",
                  "The approach to eating is completely different",
                  "Each culture has its own charm",
                  "I've learned to appreciate both ways",
                  "Neither approach is better or worse",
                  "It reflects broader cultural values",
                  "Food culture says a lot about society"
                ]
              }
            ]
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
            sampleAnswer: "The most memorable trip I've ever taken was a two-week backpacking adventure through Southeast Asia, specifically Thailand, Vietnam, and Cambodia. What made it so special was the incredible diversity of experiences packed into such a short time. I'll never forget watching the sunrise over Angkor Wat in Cambodia - it was absolutely breathtaking and felt like stepping back in time. The street food scene in Bangkok was amazing; I tried things I'd never even heard of before. But what really made the trip memorable were the people I met along the way. I connected with fellow travelers from all over the world, and we shared stories, recommendations, and even traveled together for parts of the journey. The local people were incredibly welcoming and patient with my limited language skills. It was also my first time traveling completely independently, which pushed me out of my comfort zone but gave me tremendous confidence. The combination of stunning landscapes, fascinating history, delicious food, and meaningful human connections made it an experience I'll treasure forever.",
            hints: [
              "Choose a specific trip and explain the basic details (where, when, how long)",
              "Describe 2-3 specific moments or experiences that stood out",
              "Explain what made it different from other trips you've taken",
              "Reflect on how the experience affected you personally or changed your perspectives"
            ],
            vocabularyHints: [
              {
                category: "Describing the Trip",
                expressions: [
                  "The most memorable trip I've taken was...",
                  "I'll never forget my journey to...",
                  "a two-week adventure through...",
                  "an incredible experience in...",
                  "my most unforgettable travel experience",
                  "a life-changing trip to...",
                  "one of the highlights of my life"
                ]
              },
              {
                category: "What Made It Special",
                expressions: [
                  "What made it so special was...",
                  "The thing that really stood out was...",
                  "What I'll always remember is...",
                  "The most amazing part was...",
                  "It was special because of...",
                  "What made it different was...",
                  "The magic was in..."
                ]
              },
              {
                category: "Specific Experiences",
                expressions: [
                  "I'll never forget watching the sunrise...",
                  "One moment that stands out is...",
                  "The highlight was definitely...",
                  "I was amazed by...",
                  "It felt like stepping back in time",
                  "absolutely breathtaking views",
                  "an experience I'd never had before"
                ]
              },
              {
                category: "People and Connections",
                expressions: [
                  "the people I met along the way",
                  "connected with fellow travelers",
                  "shared stories and recommendations",
                  "traveled together for part of the journey",
                  "local people were incredibly welcoming",
                  "patient with my limited language skills",
                  "meaningful human connections"
                ]
              },
              {
                category: "Personal Growth",
                expressions: [
                  "pushed me out of my comfort zone",
                  "gave me tremendous confidence",
                  "traveling completely independently",
                  "opened my eyes to...",
                  "changed my perspective on...",
                  "learned so much about myself",
                  "became more confident/independent"
                ]
              },
              {
                category: "Lasting Impact",
                expressions: [
                  "an experience I'll treasure forever",
                  "memories that will last a lifetime",
                  "it inspired me to...",
                  "made me want to travel more",
                  "I still think about it often",
                  "it changed how I see the world",
                  "set the standard for all future trips"
                ]
              }
            ]
          },
          {
            id: 2,
            title: "Cultural Shock",
            question: "Describe a time when you experienced culture shock while traveling. How did you adapt?",
            sampleAnswer: "I experienced significant culture shock during my first visit to Japan. Having grown up in a very informal culture, I was completely unprepared for the level of formality and complex social etiquette. Simple things like bowing correctly, removing shoes at the right times, and understanding when to be quiet on public transport were overwhelming at first. I remember being mortified when I accidentally wore my outdoor shoes into someone's home. The language barrier made everything more challenging since very few people spoke English, and my Japanese was practically non-existent. To adapt, I started by observing others carefully and copying their behavior. I downloaded translation apps and learned basic phrases like 'excuse me' and 'thank you.' I also asked my hostel staff for advice on social customs. Gradually, I began to appreciate the logic behind the customs - like how the quiet train rides actually created a peaceful atmosphere. By the end of my trip, I found myself naturally bowing and had developed a deep respect for Japanese culture. The experience taught me the importance of patience, observation, and cultural humility when traveling.",
            hints: [
              "Choose a specific cultural difference that really surprised or challenged you",
              "Describe your initial reaction and why it was difficult for you",
              "Explain the practical steps you took to understand and adapt",
              "Reflect on how your perspective changed and what you learned from the experience"
            ],
            vocabularyHints: [
              {
                category: "Describing Culture Shock",
                expressions: [
                  "I experienced significant culture shock",
                  "was completely unprepared for...",
                  "overwhelmed by the differences",
                  "found it challenging to understand",
                  "nothing like what I was used to",
                  "caught me completely off guard",
                  "felt like I was on another planet"
                ]
              },
              {
                category: "Specific Cultural Differences",
                expressions: [
                  "level of formality and etiquette",
                  "complex social customs",
                  "different concepts of personal space",
                  "unfamiliar social behaviors",
                  "religious/cultural practices",
                  "communication styles were different",
                  "social hierarchies I didn't understand"
                ]
              },
              {
                category: "Initial Difficulties",
                expressions: [
                  "I was mortified when I...",
                  "made several embarrassing mistakes",
                  "felt lost and confused",
                  "didn't know how to behave appropriately",
                  "worried about offending people",
                  "felt self-conscious about...",
                  "struggled to fit in"
                ]
              },
              {
                category: "Adaptation Strategies",
                expressions: [
                  "started by observing others carefully",
                  "copying their behavior",
                  "asked for advice on social customs",
                  "learned basic phrases in the local language",
                  "downloaded translation apps",
                  "read about cultural norms online",
                  "found local people willing to help"
                ]
              },
              {
                category: "Gradual Understanding",
                expressions: [
                  "gradually began to appreciate...",
                  "started to understand the logic behind...",
                  "developed a deeper respect for...",
                  "found myself naturally adopting...",
                  "began to see the beauty in...",
                  "realized there was wisdom in...",
                  "came to value these differences"
                ]
              },
              {
                category: "Lessons Learned",
                expressions: [
                  "taught me the importance of...",
                  "learned about cultural humility",
                  "patience and observation are key",
                  "became more open-minded",
                  "developed better cultural sensitivity",
                  "improved my ability to adapt",
                  "made me a better traveler"
                ]
              }
            ]
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
            sampleAnswer: "My trip planning process has become quite systematic over the years. I usually start by setting a rough budget and deciding on the time of year I want to travel, which helps narrow down destination options. Then I spend time researching potential destinations, reading travel blogs, watching YouTube videos, and checking weather patterns for different seasons. Safety is always a major consideration, so I check government travel advisories and read recent traveler reviews. Once I've chosen a destination, I create a rough itinerary, balancing must-see attractions with free time for spontaneous exploration. I book flights and accommodation well in advance to get better prices, but I try to keep some flexibility for activities. I also research local customs, basic language phrases, and transportation options. Finally, I make sure all my documents are in order - passport validity, visa requirements, and travel insurance. I've learned that good planning reduces stress and allows me to enjoy the experience more, but I always leave room for unexpected discoveries.",
            hints: [
              "Describe your step-by-step planning process from start to finish",
              "Mention key factors like budget, timing, safety, and documentation",
              "Explain how you research destinations and make decisions",
              "Balance the importance of planning with flexibility for spontaneous experiences"
            ],
            vocabularyHints: [
              {
                category: "Planning Process",
                expressions: [
                  "my planning process has become systematic",
                  "I usually start by setting a budget",
                  "create a rough itinerary",
                  "plan several months in advance",
                  "like to be well-prepared",
                  "research extensively before booking",
                  "have a checklist of things to organize"
                ]
              },
              {
                category: "Research Methods",
                expressions: [
                  "spend time researching destinations",
                  "read travel blogs and reviews",
                  "watch YouTube travel videos",
                  "check government travel advisories",
                  "look up recent traveler experiences",
                  "consult multiple sources",
                  "compare different options online"
                ]
              },
              {
                category: "Key Considerations",
                expressions: [
                  "budget is always a major factor",
                  "safety is a top priority",
                  "weather patterns for different seasons",
                  "local customs and cultural norms",
                  "transportation options available",
                  "visa requirements and documentation",
                  "travel insurance coverage"
                ]
              },
              {
                category: "Booking Strategy",
                expressions: [
                  "book flights and accommodation in advance",
                  "look for better prices and deals",
                  "try to keep some flexibility",
                  "compare prices across different sites",
                  "read cancellation policies carefully",
                  "consider peak vs. off-season pricing",
                  "book refundable options when possible"
                ]
              },
              {
                category: "Balancing Planning and Flexibility",
                expressions: [
                  "balance must-see attractions with free time",
                  "leave room for spontaneous exploration",
                  "don't over-schedule every day",
                  "allow for unexpected discoveries",
                  "plan the framework but stay flexible",
                  "good planning reduces stress",
                  "enjoy both planned and unplanned experiences"
                ]
              },
              {
                category: "Final Preparations",
                expressions: [
                  "make sure all documents are in order",
                  "check passport validity dates",
                  "research basic language phrases",
                  "understand local transportation systems",
                  "pack according to climate and activities",
                  "notify banks of travel plans",
                  "share itinerary with family/friends"
                ]
              }
            ]
          },
          {
            id: 4,
            title: "Travel Budget",
            question: "How do you manage your budget when traveling? What are your money-saving tips?",
            sampleAnswer: "Managing my travel budget has become much more strategic over the years. I start by setting a realistic total budget and then break it down into categories: flights, accommodation, food, activities, and emergency funds. I've found that accommodation and flights usually take up about 60% of my budget, so I focus on saving money there first. I use comparison websites and apps to find the best flight deals, and I'm flexible with dates to get cheaper fares. For accommodation, I mix hostels with budget hotels or Airbnb, depending on the destination. I love staying in hostels because they're affordable and great for meeting people. For food, I try to eat like a local - street food and local markets are not only cheaper but often more authentic than tourist restaurants. I always carry a reusable water bottle to avoid buying expensive bottled water. I also look for free activities like walking tours, museums with free days, and hiking trails. One of my best tips is to research local transportation passes - they can save a lot of money if you're planning to use public transport frequently. I track my spending daily using a budgeting app to make sure I'm staying on track.",
            hints: [
              "Explain how you set and allocate your travel budget across different categories",
              "Share specific strategies for saving money on major expenses like flights and accommodation",
              "Describe how you balance saving money with having authentic local experiences",
              "Mention tools or methods you use to track expenses while traveling"
            ],
            vocabularyHints: [
              {
                category: "Budget Planning",
                expressions: [
                  "set a realistic total budget",
                  "break it down into categories",
                  "allocate funds for different expenses",
                  "flights and accommodation take up most of...",
                  "always include an emergency fund",
                  "stick to my predetermined budget",
                  "plan for unexpected costs"
                ]
              },
              {
                category: "Flight and Transport Savings",
                expressions: [
                  "use comparison websites and apps",
                  "flexible with travel dates",
                  "book flights well in advance",
                  "look for budget airline options",
                  "consider connecting flights",
                  "research local transportation passes",
                  "walk or bike when possible"
                ]
              },
              {
                category: "Accommodation Strategies",
                expressions: [
                  "mix hostels with budget hotels",
                  "stay in hostels to meet people",
                  "book Airbnb for longer stays",
                  "look for places with kitchen facilities",
                  "consider shared accommodations",
                  "stay slightly outside city centers",
                  "read reviews carefully before booking"
                ]
              },
              {
                category: "Food and Dining",
                expressions: [
                  "eat like a local",
                  "street food is cheaper and authentic",
                  "shop at local markets",
                  "avoid tourist restaurants",
                  "cook your own meals when possible",
                  "carry a reusable water bottle",
                  "look for lunch specials and happy hours"
                ]
              },
              {
                category: "Activities and Entertainment",
                expressions: [
                  "look for free activities",
                  "free walking tours",
                  "museums with free admission days",
                  "explore hiking trails and nature",
                  "attend local festivals and events",
                  "research discount cards for attractions",
                  "prioritize must-see experiences"
                ]
              },
              {
                category: "Money Management",
                expressions: [
                  "track spending daily",
                  "use a budgeting app",
                  "withdraw cash from ATMs sparingly",
                  "notify banks of travel plans",
                  "carry backup payment methods",
                  "keep receipts for major purchases",
                  "stay aware of exchange rates"
                ]
              }
            ]
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
            sampleAnswer: "Good evening. I have a reservation under the name Johnson for tonight. I'm sorry, but there must be some mistake. I booked and paid for a double room with a city view two weeks ago, and I have the confirmation email right here on my phone. I understand that you're showing something different in your system, but I have all the documentation. Could you please check again, perhaps under a different spelling or confirmation number? I appreciate that these things can happen, but I've traveled a long way and really need accommodation tonight. What options do we have to resolve this? If the room I booked isn't available, could you offer me a comparable room, perhaps with an upgrade? Or if that's not possible, could you help me find alternative accommodation nearby? I'd also appreciate if any difference in cost could be adjusted, given that this wasn't my error. I'm sure we can work something out - I just want to get checked in and settled for the night.",
            hints: [
              "Start politely but firmly state your reservation details and show your confirmation",
              "Acknowledge that mistakes happen but emphasize that you have documentation",
              "Ask for specific solutions or alternatives rather than just complaining",
              "Remain calm and professional while advocating for a fair resolution"
            ],
            vocabularyHints: [
              {
                category: "Stating the Problem",
                expressions: [
                  "I have a reservation under the name...",
                  "there must be some mistake",
                  "I have the confirmation email right here",
                  "your system is showing something different",
                  "this doesn't match what I booked",
                  "I have all the documentation",
                  "paid for this reservation two weeks ago"
                ]
              },
              {
                category: "Asking for Help",
                expressions: [
                  "Could you please check again?",
                  "perhaps under a different spelling",
                  "let me give you the confirmation number",
                  "could you look up my booking?",
                  "is there another system you can check?",
                  "might it be under a different date?",
                  "can you search by email address?"
                ]
              },
              {
                category: "Explaining the Situation",
                expressions: [
                  "I understand that these things happen",
                  "I've traveled a long way",
                  "really need accommodation tonight",
                  "this wasn't my error",
                  "I've already paid for this room",
                  "don't have anywhere else to stay",
                  "booked this well in advance"
                ]
              },
              {
                category: "Requesting Solutions",
                expressions: [
                  "What options do we have to resolve this?",
                  "could you offer me a comparable room?",
                  "perhaps with an upgrade?",
                  "help me find alternative accommodation",
                  "could any cost difference be adjusted?",
                  "what can you do to help me?",
                  "I'm sure we can work something out"
                ]
              },
              {
                category: "Staying Professional",
                expressions: [
                  "I appreciate your help with this",
                  "I understand this isn't your fault",
                  "I'm sure we can find a solution",
                  "let's see what we can do",
                  "I just want to get checked in",
                  "thank you for your patience",
                  "I'm confident we can resolve this"
                ]
              },
              {
                category: "Final Requests",
                expressions: [
                  "just want to get settled for the night",
                  "can we make this work?",
                  "I'd appreciate any help you can provide",
                  "what would you do in my situation?",
                  "is there a manager I could speak with?",
                  "could you make a note of this issue?",
                  "when can this be resolved?"
                ]
              }
            ]
          },
          {
            id: 6,
            title: "Lost Luggage",
            question: "Your luggage is lost at the airport. Describe how you would handle this situation.",
            sampleAnswer: "Excuse me, I need to report lost luggage. I arrived on flight BA 1234 from London about an hour ago, but my suitcase didn't appear on the baggage carousel. I waited until all the bags were claimed, but mine definitely wasn't there. Here's my baggage claim ticket - it's a large black suitcase with red ribbons tied to the handle. The bag contains mostly clothing and some personal items, but also my laptop and some important documents I need for work tomorrow. Could you please check if it might have been put on the wrong carousel or if it's still being processed? I understand these things happen, but I'm quite concerned because I'm here for an important business meeting. What's the usual process for tracking down missing luggage? How long does it typically take to locate bags? In the meantime, could you provide me with a reference number for this claim? Also, I'll need to know about compensation for essential items I'll need to purchase tonight, like toiletries and a change of clothes. Could you give me the contact information for follow-up, and will someone call me with updates, or do I need to call back?",
            hints: [
              "Immediately explain the situation with specific flight details and timeline",
              "Provide a clear description of your luggage and its contents",
              "Ask about the tracking process and typical timeframes for recovery",
              "Inquire about immediate compensation and follow-up procedures"
            ],
            vocabularyHints: [
              {
                category: "Reporting the Problem",
                expressions: [
                  "I need to report lost luggage",
                  "arrived on flight... from...",
                  "my suitcase didn't appear on the carousel",
                  "waited until all bags were claimed",
                  "definitely wasn't there",
                  "here's my baggage claim ticket",
                  "checked in one bag at departure"
                ]
              },
              {
                category: "Describing the Luggage",
                expressions: [
                  "large black suitcase",
                  "with distinctive red ribbons",
                  "medium-sized wheeled bag",
                  "bright blue hard-shell case",
                  "has my name tag attached",
                  "approximately 20 kilos",
                  "contains mostly clothing and..."
                ]
              },
              {
                category: "Explaining Contents and Urgency",
                expressions: [
                  "contains important documents",
                  "my laptop and work materials",
                  "need for business meeting tomorrow",
                  "medication I take daily",
                  "valuable items inside",
                  "items I can't easily replace",
                  "quite concerned because..."
                ]
              },
              {
                category: "Asking About Process",
                expressions: [
                  "what's the usual process for tracking?",
                  "how long does it typically take?",
                  "might it be on the wrong carousel?",
                  "could it still be being processed?",
                  "what are the chances of recovery?",
                  "how often does this happen?",
                  "what's your success rate for finding bags?"
                ]
              },
              {
                category: "Requesting Immediate Help",
                expressions: [
                  "could you provide a reference number?",
                  "need compensation for essential items",
                  "toiletries and change of clothes",
                  "emergency purchase allowance",
                  "what can I buy while I wait?",
                  "receipt requirements for reimbursement",
                  "contact information for follow-up"
                ]
              },
              {
                category: "Follow-up and Communication",
                expressions: [
                  "will someone call me with updates?",
                  "do I need to call back?",
                  "how often should I check?",
                  "best way to stay in touch",
                  "when should I expect news?",
                  "if it's not found by tomorrow?",
                  "escalation process if needed"
                ]
              }
            ]
          }
        ]
      }
    }
  }
} as const;