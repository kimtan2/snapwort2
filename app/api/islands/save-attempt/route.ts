import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, addDoc, Timestamp, Firestore } from 'firebase/firestore';

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
let db: Firestore;
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

    // Query attempts from Firestore - REMOVED orderBy to avoid index requirement
    const attemptsRef = collection(db, 'attempts');
    const q = query(
      attemptsRef,
      where('questionId', '==', parseInt(questionId)),
      where('subtopicId', '==', subtopicId),
      where('islandId', '==', islandId),
      where('userId', '==', userId)
      // Removed: orderBy('createdAt', 'desc')
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
        revised_polished_version: data.revised_polished_version || data.improvedAnswer, // Backward compatibility
        natural_chunks: data.natural_chunks || [], // New structure
        // Legacy fields for backward compatibility
        feedback: data.feedback,
        improvedAnswer: data.improvedAnswer,
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        isTextInput: data.isTextInput,
        timestamp: data.createdAt ? data.createdAt.toDate() : new Date()
      };
    });

    // Sort in JavaScript instead of Firestore
    attempts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

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

export async function POST(request: Request) {
  try {
    if (!db) {
      return NextResponse.json({ 
        error: 'Firebase is not configured properly'
      }, { status: 500 });
    }

    const body = await request.json();
    const {
      questionId,
      subtopicId,
      islandId,
      userId = 'anonymous',
      userAnswer,
      score,
      revised_polished_version,
      natural_chunks = [],
      // Legacy fields for backward compatibility
      feedback,
      improvedAnswer,
      strengths = [],
      improvements = [],
      isTextInput = true
    } = body;

    // Validate required fields
    if (!questionId || !subtopicId || !islandId || !userAnswer) {
      return NextResponse.json({ 
        error: 'Missing required fields: questionId, subtopicId, islandId, userAnswer'
      }, { status: 400 });
    }

    // Create the attempt document with new structure
    const attemptData = {
      questionId: parseInt(questionId),
      subtopicId,
      islandId,
      userId,
      userAnswer,
      score: score || 0,
      revised_polished_version: revised_polished_version || improvedAnswer || '',
      natural_chunks: Array.isArray(natural_chunks) ? natural_chunks : [],
      // Keep legacy fields for backward compatibility
      feedback: feedback || '',
      improvedAnswer: improvedAnswer || revised_polished_version || '',
      strengths: Array.isArray(strengths) ? strengths : [],
      improvements: Array.isArray(improvements) ? improvements : [],
      isTextInput: Boolean(isTextInput),
      createdAt: Timestamp.now()
    };

    // Add the attempt to Firestore
    const attemptsRef = collection(db, 'attempts');
    const docRef = await addDoc(attemptsRef, attemptData);

    return NextResponse.json({ 
      success: true,
      attemptId: docRef.id,
      message: 'Attempt saved successfully'
    });

  } catch (error) {
    console.error('Error saving attempt:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to save attempt'
    }, { status: 500 });
  }
}