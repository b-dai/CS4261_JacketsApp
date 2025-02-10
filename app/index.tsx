import React, { useState, createContext, useContext } from 'react'
import { RouteProp } from '@react-navigation/native'
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StyleSheet, View, Text, TextInput, Button, FlatList, TouchableOpacity, SafeAreaView } from 'react-native'

type Comment = { id: string; user: { id: string; name: string }; text: string }
type Post = { id: string; user: { id: string; name: string }; content: string; comments: Comment[]; likes: number; dislikes: number }

const initialPosts: Post[] = [
  { id: '1', user: { id: 'u1', name: 'Alice' }, content: 'Loving the weather today!', comments: [ { id: 'c1', user: { id: 'u2', name: 'Bob' }, text: 'Absolutely beautiful!' }, { id: 'c2', user: { id: 'u3', name: 'Charlie' }, text: 'Enjoy!' } ], likes: 0, dislikes: 0 },
  { id: '2', user: { id: 'u2', name: 'Bob' }, content: 'Just had a great cup of coffee.', comments: [ { id: 'c3', user: { id: 'u1', name: 'Alice' }, text: 'I need one too!' } ], likes: 0, dislikes: 0 }
]

const dummyFriends = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
  { id: 'u3', name: 'Charlie' }
]

type PostsContextType = { posts: Post[]; setPosts: React.Dispatch<React.SetStateAction<Post[]>> }
const PostsContext = createContext<PostsContextType>({ posts: [], setPosts: () => {} })

type RootStackParamList = {
  Login: undefined
  Home: undefined
  Comments: { post: Post }
  Profile: { user?: { id: string; name: string }; current?: boolean }
  CreatePost: undefined
}
type TabParamList = {
  Feed: undefined
  Friends: undefined
  Profile: { current: boolean }
}

type LoginScreenProps = StackScreenProps<RootStackParamList, 'Login'>
const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const handleLogin = () => { navigation.replace('Home') }
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
  const handleLike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p))
  }
  const handleDislike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, dislikes: p.dislikes + 1 } : p))
  }
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
      <FlatList data={posts} keyExtractor={item => item.id} renderItem={renderPost} contentContainerStyle={{ padding: 10 }} />
    </SafeAreaView>
  )
}

type CreatePostScreenProps = StackScreenProps<RootStackParamList, 'CreatePost'>
const CreatePostScreen = ({ navigation }: CreatePostScreenProps) => {
  const { posts, setPosts } = useContext(PostsContext)
  const [content, setContent] = useState('')
  const handleCreate = () => {
    const newPost: Post = { id: (posts.length + 1).toString(), user: { id: 'current', name: 'You' }, content, comments: [], likes: 0, dislikes: 0 }
    setPosts([newPost, ...posts])
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

type CommentsScreenProps = StackScreenProps<RootStackParamList, 'Comments'>
const CommentsScreen = ({ route, navigation }: CommentsScreenProps) => {
  const { post } = route.params
  const [commentText, setCommentText] = useState('')
  const handleAddComment = () => { alert(`Comment added: ${commentText}`); setCommentText('') }
  return (
    <SafeAreaView style={styles.container}>
      <Button title="Back" onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Comments for: {post.content}</Text>
      <FlatList data={post.comments} keyExtractor={item => item.id} renderItem={({ item }) => (
        <View style={styles.commentContainer}>
          <Text style={styles.commentUser}>{item.user.name}:</Text>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      )} contentContainerStyle={{ padding: 10 }} />
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
      <FlatList data={dummyFriends} keyExtractor={item => item.id} renderItem={renderFriend} contentContainerStyle={{ padding: 10 }} />
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

const Tab = createBottomTabNavigator<TabParamList>()
const HomeTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name="Feed" component={FeedScreen} />
    <Tab.Screen name="Friends" component={FriendsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} initialParams={{ current: true }} />
  </Tab.Navigator>
)

const Stack = createStackNavigator<RootStackParamList>()
const AppNavigator = () => (
  <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Home" component={HomeTabs} />
    <Stack.Screen name="Comments" component={CommentsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="CreatePost" component={CreatePostScreen} />
  </Stack.Navigator>
)

export default function App() {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  return (
    <PostsContext.Provider value={{ posts, setPosts }}>
      <AppNavigator />
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
  friendName: { fontSize: 16 }
})
