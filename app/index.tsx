import React, { useState } from 'react'
import { RouteProp } from '@react-navigation/native'
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StyleSheet, View, Text, TextInput, Button, FlatList, TouchableOpacity, SafeAreaView } from 'react-native'

const dummyPosts = [
  {
    id: '1',
    user: { id: 'u1', name: 'Alice' },
    content: 'Loving the weather today!',
    comments: [
      { id: 'c1', user: { id: 'u2', name: 'Bob' }, text: 'Absolutely beautiful!' },
      { id: 'c2', user: { id: 'u3', name: 'Charlie' }, text: 'Enjoy!' }
    ]
  },
  {
    id: '2',
    user: { id: 'u2', name: 'Bob' },
    content: 'Just had a great cup of coffee.',
    comments: [
      { id: 'c3', user: { id: 'u1', name: 'Alice' }, text: 'I need one too!' }
    ]
  }
]

const dummyFriends = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
  { id: 'u3', name: 'Charlie' }
]

type RootStackParamList = {
  Login: undefined
  Home: undefined
  Comments: { post: typeof dummyPosts[0] }
  Profile: { user?: { id: string; name: string }; current?: boolean }
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
  const renderPost = ({ item }: { item: typeof dummyPosts[0] }) => (
    <View style={styles.postContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('Profile', { user: item.user, current: false })}>
        <Text style={styles.postUser}>{item.user.name}</Text>
      </TouchableOpacity>
      <Text style={styles.postContent}>{item.content}</Text>
      <Button title={`View Comments (${item.comments.length})`} onPress={() => navigation.navigate('Comments', { post: item })} />
    </View>
  )
  return (
    <SafeAreaView style={styles.container}>
      <FlatList data={dummyPosts} keyExtractor={(item) => item.id} renderItem={renderPost} contentContainerStyle={{ padding: 10 }} />
    </SafeAreaView>
  )
}

type CommentsScreenProps = StackScreenProps<RootStackParamList, 'Comments'>
const CommentsScreen = ({ route }: CommentsScreenProps) => {
  const { post } = route.params
  const [commentText, setCommentText] = useState('')
  const handleAddComment = () => { alert(`Comment added: ${commentText}`); setCommentText('') }
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Comments for: {post.content}</Text>
      <FlatList data={post.comments} keyExtractor={(item) => item.id} renderItem={({ item }) => (
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
  const renderFriend = ({ item }: { item: typeof dummyFriends[0] }) => (
    <TouchableOpacity style={styles.friendItem} onPress={() => navigation.navigate('Profile', { user: item, current: false })}>
      <Text style={styles.friendName}>{item.name}</Text>
    </TouchableOpacity>
  )
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Friends</Text>
      <FlatList data={dummyFriends} keyExtractor={(item) => item.id} renderItem={renderFriend} contentContainerStyle={{ padding: 10 }} />
    </SafeAreaView>
  )
}

type ProfileScreenRouteProp =
  | RouteProp<RootStackParamList, 'Profile'>
  | RouteProp<TabParamList, 'Profile'>
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
  <Tab.Navigator>
    <Tab.Screen name="Feed" component={FeedScreen} />
    <Tab.Screen name="Friends" component={FriendsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} initialParams={{ current: true }} />
  </Tab.Navigator>
)

const Stack = createStackNavigator<RootStackParamList>()
const AppNavigator = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
    <Stack.Screen name="Comments" component={CommentsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
)

export default AppNavigator

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
