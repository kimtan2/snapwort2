import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let db: any;
try {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export async function GET(request: Request) {
  try {
    if (!db) {
      return NextResponse.json({ 
        error: 'Firebase is not configured properly'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const subtopicId = searchParams.get('subtopicId');
    const islandId = searchParams.get('islandId');
    const userId = searchParams.get('userId') || 'anonymous';

    if (!questionId || !subtopicId || !islandId) {
      return NextResponse.json({ 
        error: 'Missing required query parameters: questionId, subtopicId, islandId'
      }, { status: 400 });
    }

    // Query attempts from Firestore
    const attemptsRef = collection(db, 'attempts');
    const q = query(
      attemptsRef,
      where('questionId', '==', parseInt(questionId)),
      where('subtopicId', '==', subtopicId),
      where('islandId', '==', islandId),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const attempts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        questionId: data.questionId,
        subtopicId: data.subtopicId,
        islandId: data.islandId,
        userAnswer: data.userAnswer,
        score: data.score,
        feedback: data.feedback,
        improvedAnswer: data.improvedAnswer,
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        isTextInput: data.isTextInput,
        timestamp: data.createdAt ? data.createdAt.toDate() : new Date()
      };
    });

    return NextResponse.json({ 
      success: true, 
      attempts 
    });

  } catch (error) {
    console.error('Error fetching attempts:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch attempts'
    }, { status: 500 });
  }
}