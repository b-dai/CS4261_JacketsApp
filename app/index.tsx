import React, { useState, createContext, useContext, useEffect } from 'react'
import { RouteProp, Dimensions, Animated, PanResponder, StyleSheet, View, Text, TextInput, Button, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native'
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { fetchPosts, createPost, fetchBulletins, createBulletin } from '../api'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { getFirestore, collection, onSnapshot } from 'firebase/firestore'

type Comment = { id: string; user: { id: string; name: string }; text: string }
type Post = { id: string; user: { id: string; name: string }; content: string; comments: Comment[]; likes: number; dislikes: number }
type BulletinPost = { id: string; title: string; content: string; category: string; x: number; y: number }

const dummyFriends = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
  { id: 'u3', name: 'Charlie' }
]

type PostsContextType = { posts: Post[]; setPosts: React.Dispatch<React.SetStateAction<Post[]>> }
export const PostsContext = createContext<PostsContextType>({ posts: [], setPosts: () => {} })

type BulletinContextType = { bulletins: BulletinPost[]; setBulletins: React.Dispatch<React.SetStateAction<BulletinPost[]>> }
export const BulletinContext = createContext<BulletinContextType>({ bulletins: [], setBulletins: () => {} })

type RootStackParamList = {
  Login: undefined
  Register: undefined
  Home: undefined
  Comments: { post: Post }
  Profile: { user?: { id: string; name: string }; current?: boolean }
  CreatePost: undefined
  Bulletin: undefined
  CreateBulletin: undefined
}
type TabParamList = {
  Feed: undefined
  Friends: undefined
  Profile: { current: boolean }
  Bulletin: undefined
}

type LoginScreenProps = StackScreenProps<RootStackParamList, 'Login'>
const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      if (!userCredential.user.emailVerified) {
        Alert.alert('Verification', 'Please verify your email before logging in.')
        await signOut(auth)
        return
      }
      navigation.replace('Home')
    } catch (error: any) {
      Alert.alert('Login Error', error.message)
    }
  }
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome to Jackets</Text>
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
      <View style={styles.buttonContainer}>
        <Button title="Login" onPress={handleLogin} color="#4A90E2" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Register" onPress={() => navigation.navigate('Register')} color="#50E3C2" />
      </View>
    </SafeAreaView>
  )
}

type RegisterScreenProps = StackScreenProps<RootStackParamList, 'Register'>
const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const handleRegister = async () => {
    if (!email.endsWith('@gatech.edu')) {
      Alert.alert('Error', 'Email must be a @gatech.edu address')
      return
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await sendEmailVerification(userCredential.user)
      Alert.alert('Success', 'Verification email sent. Please verify before logging in.')
      navigation.goBack()
    } catch (error: any) {
      Alert.alert('Registration Error', error.message)
    }
  }
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
      <View style={styles.buttonContainer}>
        <Button title="Register" onPress={handleRegister} color="#4A90E2" />
      </View>
    </SafeAreaView>
  )
}

const FeedScreen = ({ navigation }: { navigation: any }) => {
  const { posts, setPosts } = useContext(PostsContext)
  const handleLike = (id: string) => { setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p)) }
  const handleDislike = (id: string) => { setPosts(prev => prev.map(p => p.id === id ? { ...p, dislikes: p.dislikes + 1 } : p)) }
  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('Profile', { user: item.user, current: false })}>
        <Text style={styles.postUser}>{item.user.name}</Text>
      </TouchableOpacity>
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.reactionContainer}>
        <Button title={`Like (${item.likes})`} onPress={() => handleLike(item.id)} color="#4A90E2" />
        <Button title={`Dislike (${item.dislikes})`} onPress={() => handleDislike(item.id)} color="#D0021B" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title={`View Comments (${item.comments.length})`} onPress={() => navigation.navigate('Comments', { post: item })} color="#9013FE" />
      </View>
    </View>
  )
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerButtonContainer}>
        <Button title="Create New Post" onPress={() => navigation.navigate('CreatePost')} color="#50E3C2" />
      </View>
      <FlatList data={posts} keyExtractor={(item, index) => item.id ? item.id : `post-${index}`} renderItem={renderPost} contentContainerStyle={styles.flatListContent} />
    </SafeAreaView>
  )
}

const CreatePostScreen = ({ navigation }: StackScreenProps<RootStackParamList, 'CreatePost'>) => {
  const { posts, setPosts } = useContext(PostsContext)
  const [content, setContent] = useState('')
  const handleCreate = async () => {
    const newPost: Post = { id: '', user: { id: 'current', name: 'You' }, content, comments: [], likes: 0, dislikes: 0 }
    const savedPost = await createPost(newPost)
    setPosts([savedPost, ...posts])
    navigation.goBack()
  }
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create New Post</Text>
      <TextInput placeholder="What's on your mind?" style={styles.input} value={content} onChangeText={setContent} multiline />
      <View style={styles.buttonContainer}>
        <Button title="Post" onPress={handleCreate} color="#4A90E2" />
      </View>
    </SafeAreaView>
  )
}

const DraggableBulletin = ({ bulletin, updatePosition, style = {} }: { bulletin: BulletinPost; updatePosition: (id: string, x: number, y: number) => void; style?: object }) => {
  const pan = useState(new Animated.ValueXY({ x: bulletin.x, y: bulletin.y }))[0]
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { pan.setOffset({ x: pan.x._value, y: pan.y._value }); pan.setValue({ x: 0, y: 0 }) },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: () => { pan.flattenOffset(); updatePosition(bulletin.id, pan.x._value, pan.y._value) }
  })
  return (
    <Animated.View {...panResponder.panHandlers} style={[pan.getLayout(), styles.bulletinBox, style]}>
      <Text style={styles.bulletinTitle}>{bulletin.title}</Text>
      <Text style={styles.bulletinContent}>{bulletin.content}</Text>
      <Text style={styles.bulletinCategory}>{bulletin.category}</Text>
    </Animated.View>
  )
}

const BulletinScreen = ({ navigation }: { navigation: any }) => {
  const { bulletins, setBulletins } = useContext(BulletinContext)
  const [filter, setFilter] = useState('All')
  const updateBulletinPosition = (id: string, x: number, y: number) => { setBulletins(prev => prev.map(b => b.id === id ? { ...b, x, y } : b)) }
  const categories = ['All', ...Array.from(new Set(bulletins.map(b => b.category)))]
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerButtonContainer}>
        <Button title="Create Bulletin" onPress={() => navigation.navigate('CreateBulletin')} color="#50E3C2" />
      </View>
      <View style={styles.filterContainer}>
        {categories.map(cat => (
          <View key={cat} style={styles.filterButton}>
            <Button title={cat} onPress={() => setFilter(cat)} color="#4A90E2" />
          </View>
        ))}
      </View>
      <View style={styles.bulletinContainer}>
        {bulletins.map((bulletin, index) => {
          const isVisible = filter === 'All' || bulletin.category === filter
          return (
            <DraggableBulletin
              key={bulletin.id ? bulletin.id : `bulletin-${index}`}
              bulletin={bulletin}
              updatePosition={updateBulletinPosition}
              style={isVisible ? {} : { display: 'none' }}
            />
          )
        })}
      </View>
    </SafeAreaView>
  )
}

const CreateBulletinScreen = ({ navigation }: StackScreenProps<RootStackParamList, 'CreateBulletin'>) => {
  const { bulletins, setBulletins } = useContext(BulletinContext)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const handleCreate = async () => {
    const newBulletin: BulletinPost = { id: '', title, content, category, x: 50, y: 50 }
    const savedBulletin = await createBulletin(newBulletin)
    setBulletins([savedBulletin, ...bulletins])
    navigation.goBack()
  }
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create Bulletin</Text>
      <TextInput placeholder="Title" style={styles.input} value={title} onChangeText={setTitle} />
      <TextInput placeholder="Content" style={styles.input} value={content} onChangeText={setContent} multiline />
      <TextInput placeholder="Category" style={styles.input} value={category} onChangeText={setCategory} />
      <View style={styles.buttonContainer}>
        <Button title="Post Bulletin" onPress={handleCreate} color="#4A90E2" />
      </View>
    </SafeAreaView>
  )
}

type CommentsScreenProps = StackScreenProps<RootStackParamList, 'Comments'>
const CommentsScreen = ({ route, navigation }: CommentsScreenProps) => {
  const { post } = route.params
  const [commentText, setCommentText] = useState('')
  const handleAddComment = () => { Alert.alert(`Comment added: ${commentText}`); setCommentText('') }
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerButtonContainer}>
        <Button title="Back" onPress={() => navigation.goBack()} color="#D0021B" />
      </View>
      <Text style={styles.title}>Comments for: {post.content}</Text>
      <FlatList
        data={post.comments}
        keyExtractor={(item, index) => item.id ? item.id : `comment-${index}`}
        renderItem={({ item }) => (
          <View style={styles.commentContainer}>
            <Text style={styles.commentUser}>{item.user.name}:</Text>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.flatListContent}
      />
      <TextInput placeholder="Add a comment..." style={styles.input} value={commentText} onChangeText={setCommentText} />
      <View style={styles.buttonContainer}>
        <Button title="Post Comment" onPress={handleAddComment} color="#4A90E2" />
      </View>
    </SafeAreaView>
  )
}

const FriendsScreen = ({ navigation }: { navigation: any }) => {
  const renderFriend = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity style={styles.friendItem} onPress={() => navigation.navigate('Profile', { user: item, current: false })}>
      <Text style={styles.friendName}>{item.name}</Text>
    </TouchableOpacity>
  )
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Friends</Text>
      <FlatList
        data={dummyFriends}
        keyExtractor={(item, index) => item.id ? item.id : `friend-${index}`}
        renderItem={renderFriend}
        contentContainerStyle={styles.flatListContent}
      />
    </SafeAreaView>
  )
}

type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'> | RouteProp<TabParamList, 'Profile'>
type ProfileScreenProps = { route: ProfileScreenRouteProp; navigation: any }
const ProfileScreen = ({ route }: ProfileScreenProps) => {
  const params = route.params as { user?: { id: string; name: string }; current?: boolean }
  const user = params.user || { id: 'current', name: 'You' }
  const [isFriend, setIsFriend] = useState(false)
  const handleAddFriend = () => { setIsFriend(true); Alert.alert(`You are now friends with ${user.name}`) }
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile: {user.name}</Text>
      {params.current ? (
        <Text style={styles.text}>This is your profile.</Text>
      ) : (
        <>
          <Text style={styles.text}>Some dummy info about {user.name}.</Text>
          {!isFriend ? (
            <View style={styles.buttonContainer}>
              <Button title="Add Friend" onPress={handleAddFriend} color="#50E3C2" />
            </View>
          ) : (
            <Text style={styles.text}>You are friends!</Text>
          )}
        </>
      )}
    </SafeAreaView>
  )
}

const TabNavigator = createBottomTabNavigator<TabParamList>()
const HomeTabs = () => (
  <TabNavigator.Navigator screenOptions={{ headerShown: false }}>
    <TabNavigator.Screen name="Feed" component={FeedScreen} />
    <TabNavigator.Screen name="Friends" component={FriendsScreen} />
    <TabNavigator.Screen name="Profile" component={ProfileScreen} initialParams={{ current: true }} />
    <TabNavigator.Screen name="Bulletin" component={BulletinScreen} />
  </TabNavigator.Navigator>
)

const StackNavigator = createStackNavigator<RootStackParamList>()
const AppNavigator = () => (
  <StackNavigator.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <StackNavigator.Screen name="Login" component={LoginScreen} />
    <StackNavigator.Screen name="Register" component={RegisterScreen} />
    <StackNavigator.Screen name="Home" component={HomeTabs} />
    <StackNavigator.Screen name="Comments" component={CommentsScreen} />
    <StackNavigator.Screen name="Profile" component={ProfileScreen} />
    <StackNavigator.Screen name="CreatePost" component={CreatePostScreen} />
    <StackNavigator.Screen name="Bulletin" component={BulletinScreen} />
    <StackNavigator.Screen name="CreateBulletin" component={CreateBulletinScreen} />
  </StackNavigator.Navigator>
)

export default function App() {
  const [posts, setPosts] = useState<Post[]>([])
  const [bulletins, setBulletins] = useState<BulletinPost[]>([])
  const dbWidth = Dimensions.get('window').width
  useEffect(() => {
    const db = dbWidth
    const unsubPosts = onSnapshot(collection(getFirestore(), "posts"), snapshot => {
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[]
      setPosts(fetchedPosts)
    })
    const unsubBulletins = onSnapshot(collection(getFirestore(), "bulletins"), snapshot => {
      const randomized = snapshot.docs.map(doc => {
        const bulletin = { id: doc.id, ...doc.data() } as BulletinPost
        return { ...bulletin, x: Math.random() * (dbWidth - 150), y: Math.random() * 300 }
      })
      setBulletins(randomized)
    })
    return () => {
      unsubPosts()
      unsubBulletins()
    }
  }, [dbWidth])
  return (
    <PostsContext.Provider value={{ posts, setPosts }}>
      <BulletinContext.Provider value={{ bulletins, setBulletins }}>
        <AppNavigator />
      </BulletinContext.Provider>
    </PostsContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#FAFAFC'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    color: '#333'
  },
  text: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  buttonContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden'
  },
  headerButtonContainer: {
    marginBottom: 20,
    alignSelf: 'center',
    width: '80%'
  },
  postContainer: {
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  postUser: {
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 18,
    color: '#222'
  },
  postContent: {
    marginBottom: 12,
    fontSize: 16,
    color: '#444'
  },
  reactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  commentUser: {
    fontWeight: '700',
    marginRight: 8,
    fontSize: 16,
    color: '#333'
  },
  commentText: {
    fontSize: 16,
    color: '#555'
  },
  friendItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  friendName: {
    fontSize: 18,
    color: '#333'
  },
  bulletinBox: {
    width: 150,
    padding: 12,
    backgroundColor: '#FFF4E5',
    borderWidth: 1,
    borderColor: '#E0B87F',
    borderRadius: 10
  },
  bulletinTitle: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 16,
    color: '#8A4B29'
  },
  bulletinContent: {
    fontSize: 15,
    color: '#663D26'
  },
  bulletinCategory: {
    fontSize: 13,
    marginTop: 4,
    color: '#A67C52'
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 4
  },
  bulletinContainer: {
    flex: 1,
    position: 'relative'
  },
  flatListContent: {
    paddingBottom: 20
  }
})
