// lib/firestore-station.ts
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    getDoc,
    query, 
    orderBy, 
    where,
    Timestamp, 
    setDoc
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  // Types
  export interface Station {
    id: string;
    name: string;
    description: string;
    icon: string;
    createdAt: Date;
  }
  
  export interface Skill {
    id: string;
    name: string;
    description: string;
    stationId: string;
    createdAt: Date;
  }
  
  export interface Mission {
    id: string;
    title: string;
    type: 'agreeDisagree' | 'situationReact';
    data: any; // Mission configuration data
    skillId: string;
    stationId: string;
    createdAt: Date;
  }
  
  export interface MissionAttempt {
    id: string;
    missionId: string;
    skillId: string;
    stationId: string;
    userId: string;
    userResponse: string;
    feedback: string;
    polishedVersion: string;
    score: number;
    completedAt: Date;
  }
  
 // Update the createStation function
export const createStation = async (stationId: string, stationData: Omit<Station, 'id' | 'createdAt'>) => {
  const docRef = doc(db, 'stations', stationId); // Use specific stationId as document ID
  await setDoc(docRef, {
    ...stationData,
    createdAt: Timestamp.now()
  });
  return stationId;
};
  
  export const getStation = async (stationId: string): Promise<Station | null> => {
    const docRef = doc(db, 'stations', stationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate()
      } as Station;
    }
    return null;
  };
  
  // Skill functions
  export const createSkill = async (stationId: string, skillData: Omit<Skill, 'id' | 'stationId' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, 'stations', stationId, 'skills'), {
      ...skillData,
      stationId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  };
  
  export const getSkills = async (stationId: string): Promise<Skill[]> => {
    const q = query(
      collection(db, 'stations', stationId, 'skills'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Skill[];
  };
  
  export const deleteSkill = async (stationId: string, skillId: string) => {
    await deleteDoc(doc(db, 'stations', stationId, 'skills', skillId));
  };
  
  // Mission functions
  export const createMission = async (
    stationId: string, 
    skillId: string, 
    missionData: Omit<Mission, 'id' | 'skillId' | 'stationId' | 'createdAt'>
  ) => {
    const docRef = await addDoc(collection(db, 'stations', stationId, 'skills', skillId, 'missions'), {
      ...missionData,
      skillId,
      stationId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  };
  
  export const getMissions = async (stationId: string, skillId: string): Promise<Mission[]> => {
    const q = query(
      collection(db, 'stations', stationId, 'skills', skillId, 'missions'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Mission[];
  };
  
  export const deleteMission = async (stationId: string, skillId: string, missionId: string) => {
    await deleteDoc(doc(db, 'stations', stationId, 'skills', skillId, 'missions', missionId));
  };
  
  // Mission Attempt functions
  export const createMissionAttempt = async (
    stationId: string,
    skillId: string,
    missionId: string,
    attemptData: Omit<MissionAttempt, 'id' | 'missionId' | 'skillId' | 'stationId' | 'completedAt'>
  ) => {
    const docRef = await addDoc(
      collection(db, 'stations', stationId, 'skills', skillId, 'missions', missionId, 'attempts'),
      {
        ...attemptData,
        missionId,
        skillId,
        stationId,
        completedAt: Timestamp.now()
      }
    );
    return docRef.id;
  };
  
  export const getMissionAttempts = async (
    stationId: string,
    skillId: string,
    missionId: string,
    userId: string
  ): Promise<MissionAttempt[]> => {
    const q = query(
      collection(db, 'stations', stationId, 'skills', skillId, 'missions', missionId, 'attempts'),
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt.toDate()
    })) as MissionAttempt[];
  };
  
  // Get mission completion status
  export const getMissionCompletionStatus = async (
    stationId: string,
    skillId: string,
    missionId: string,
    userId: string
  ): Promise<{ completed: boolean; lastAttempt?: MissionAttempt }> => {
    const attempts = await getMissionAttempts(stationId, skillId, missionId, userId);
    
    return {
      completed: attempts.length > 0,
      lastAttempt: attempts[0] // Most recent attempt
    };
  };