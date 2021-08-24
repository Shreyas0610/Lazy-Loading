import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import SearchScreen from './screens/SearchScreen';
import BookTransaction from './screens/BookTransaction';
import { createAppContainer} from 'react-navigation'; 
import {createBottomTabNavigator} from 'react-navigation-tabs'

export default function App() {
  return (
      <AppContainer/>
  );
}

const tabNavigator = createBottomTabNavigator({
  Transaction:{screen:BookTransaction},
  Search:{screen:SearchScreen}
},
{
  defaultNavigationOptions: ({navigation})=>({
    tabBarIcon: ()=>{
      const routeName = navigation.state.routeName;

      if(routeName === "Transaction"){
        return(
          <Image
            source={require('./assets/book.png')}
            style={{width: 30, height: 30}}
          />
        )
      }
      
      else if(routeName === "Search"){
        return(
          <Image
            source={require('./assets/searchingbook.png')}
            style={{width: 30, height: 30}}
          />
        )
      }
    }
  })
}
)

const AppContainer = createAppContainer(tabNavigator)



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


