import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore'
import { db } from './firebase'

export const fetchPosts = async () => {
  const postsCol = collection(db, 'posts')
  const q = query(postsCol, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  return posts
}

export const createPost = async (post) => {
  const postsCol = collection(db, 'posts')
  const docRef = await addDoc(postsCol, { ...post, createdAt: new Date() })
  return { id: docRef.id, ...post }
}

export const fetchBulletins = async () => {
  const bulletinsCol = collection(db, 'bulletins')
  const q = query(bulletinsCol, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  const bulletins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  return bulletins
}

export const createBulletin = async (bulletin) => {
  const bulletinsCol = collection(db, 'bulletins')
  const docRef = await addDoc(bulletinsCol, { ...bulletin, createdAt: new Date() })
  return { id: docRef.id, ...bulletin }
}