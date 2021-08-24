import * as firebase from 'firebase' 
require('@firebase/firestore') 

var firebaseConfig = {
    apiKey: "AIzaSyDt0YUe2qJ0_l7LlQQ0NWs8VsTtxsLE2N8",
    authDomain: "library-app-3d0fd.firebaseapp.com",
    projectId: "library-app-3d0fd",
    storageBucket: "library-app-3d0fd.appspot.com",
    messagingSenderId: "122957703960",
    appId: "1:122957703960:web:4f3380f82a8a677c550c6d"
  }; // Initialize Firebase 
  firebase.initializeApp(firebaseConfig); 
  export default firebase.firestore();





