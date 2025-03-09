import React, { useState, createContext, useContext, useEffect } from 'react'
import { RouteProp, Dimensions, Animated, PanResponder, StyleSheet, View, Text, TextInput, Button, FlatList, TouchableOpacity, SafeAreaView, Alert } from 'react-native'
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { fetchPosts, createPost, fetchBulletins, createBulletin } from '../api'

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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const handleLogin = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required.')
      return
    }
    navigation.replace('Home')
  }
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome to Jackets</Text>
      <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
      <Button title="Login" onPress={handleLogin} />
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
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        <Button title={`Like (${item.likes})`} onPress={() => handleLike(item.id)} />
        <Button title={`Dislike (${item.dislikes})`} onPress={() => handleDislike(item.id)} />
      </View>
      <Button title={`View Comments (${item.comments.length})`} onPress={() => navigation.navigate('Comments', { post: item })} />
    </View>
  )
  return (
    <SafeAreaView style={styles.container}>
      <Button title="Create New Post" onPress={() => navigation.navigate('CreatePost')} />
      <FlatList
        data={posts}
        keyExtractor={(item, index) => item.id ? item.id : `post-${index}`}
        renderItem={renderPost}
        contentContainerStyle={{ padding: 10 }}
      />
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
      <TextInput placeholder="What's on your mind?" style={styles.input} value={content} onChangeText={setContent} />
      <Button title="Post" onPress={handleCreate} />
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
    <Animated.View {...panResponder.panHandlers} style={[{ position: 'absolute' }, pan.getLayout(), styles.bulletinBox, style]}>
      <Text style={styles.bulletinTitle}>{bulletin.title}</Text>
      <Text style={styles.bulletinContent}>{bulletin.content}</Text>
      <Text style={styles.bulletinCategory}>{bulletin.category}</Text>
    </Animated.View>
  )
}

const BulletinScreen = ({ navigation }: { navigation: any }) => {
  const { bulletins, setBulletins } = useContext(BulletinContext)
  const [filter, setFilter] = useState('All')
  const updateBulletinPosition = (id: string, x: number, y: number) => {
    setBulletins(prev => prev.map(b => b.id === id ? { ...b, x, y } : b))
  }
  const categories = ['All', ...Array.from(new Set(bulletins.map(b => b.category)))]
  return (
    <SafeAreaView style={styles.container}>
      <Button title="Create Bulletin" onPress={() => navigation.navigate('CreateBulletin')} />
      <View style={styles.filterContainer}>
        {categories.map(cat => (
          <Button key={cat} title={cat} onPress={() => setFilter(cat)} />
        ))}
      </View>
      <View style={{ flex: 1 }}>
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
      <TextInput placeholder="Content" style={styles.input} value={content} onChangeText={setContent} />
      <TextInput placeholder="Category" style={styles.input} value={category} onChangeText={setCategory} />
      <Button title="Post Bulletin" onPress={handleCreate} />
    </SafeAreaView>
  )
}

type CommentsScreenProps = StackScreenProps<RootStackParamList, 'Comments'>
const CommentsScreen = ({ route, navigation }: CommentsScreenProps) => {
  const { post } = route.params
  const [commentText, setCommentText] = useState('')
  const handleAddComment = () => { alert(`Comment added: ${commentText}`); setCommentText('') }
  return (
    <SafeAreaView style={styles.container}>
      <Button title="Back" onPress={() => navigation.goBack()} />
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
        contentContainerStyle={{ padding: 10 }}
      />
      <TextInput placeholder="Add a comment..." style={styles.input} value={commentText} onChangeText={setCommentText} />
      <Button title="Post Comment" onPress={handleAddComment} />
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
        contentContainerStyle={{ padding: 10 }}
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
  const handleAddFriend = () => { setIsFriend(true); alert(`You are now friends with ${user.name}`) }
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile: {user.name}</Text>
      {params.current ? (
        <Text>This is your profile.</Text>
      ) : (
        <>
          <Text>Some dummy info about {user.name}.</Text>
          {!isFriend ? (
            <Button title="Add Friend" onPress={handleAddFriend} />
          ) : (
            <Text>You are friends!</Text>
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
  useEffect(() => {
    fetchPosts().then(data => setPosts(data))
    fetchBulletins().then(data => {
      const { width } = Dimensions.get('window')
      const randomized = data.map((bulletin, index) => ({
        ...bulletin,
        x: Math.random() * (width - 150),
        y: Math.random() * 300
      }))
      setBulletins(randomized)
    })
  }, [])
  return (
    <PostsContext.Provider value={{ posts, setPosts }}>
      <BulletinContext.Provider value={{ bulletins, setBulletins }}>
        <AppNavigator />
      </BulletinContext.Provider>
    </PostsContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 4 },
  postContainer: { marginBottom: 20, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, backgroundColor: '#fafafa' },
  postUser: { fontWeight: 'bold', marginBottom: 4, fontSize: 16 },
  postContent: { marginBottom: 8, fontSize: 14 },
  commentContainer: { flexDirection: 'row', marginBottom: 4 },
  commentUser: { fontWeight: 'bold', marginRight: 6 },
  commentText: { fontStyle: 'italic' },
  friendItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  friendName: { fontSize: 16 },
  bulletinBox: { width: 150, padding: 10, backgroundColor: '#ffd', borderWidth: 1, borderColor: '#cc9', borderRadius: 6 },
  bulletinTitle: { fontWeight: 'bold', marginBottom: 4 },
  bulletinContent: { fontSize: 14 },
  bulletinCategory: { fontSize: 12, marginTop: 4 },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }
})
