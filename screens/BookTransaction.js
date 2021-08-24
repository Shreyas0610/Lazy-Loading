import { StatusBar } from 'expo-status-bar';
import react from 'react';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Alert, ToastAndroid } from 'react-native';
import * as Permissions from 'expo-permissions'
import { BarCodeScanner } from 'expo-barcode-scanner';
import db from '../config';
import firebase from 'firebase';

export default class BookTransaction extends React.Component {
    constructor() {
        super()
        this.state = {
            hasCameraPermissions: null,
            scanned: false,
            scannedData: '',
            buttonState: 'normal',
            scannedStudentID: '',
            scannedBookID: '',
            transactionMessage: '',
        }
    }

    getCameraPermission = async (ID) => {
        const { status } = await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermissions: status == 'granted',
            buttonState: ID,
            scanned: false,
        })
    }

    handleBarCodeScanned = async ({ type, data }) => {
        const { buttonState } = this.state
        if (buttonState === 'BookID') {
            this.setState({
                scanned: true,
                scannedBookID: data,
                buttonState: 'normal'
            })
        }
        else if (buttonState === 'StudentID') {
            this.setState({
                scanned: true,
                scannedStudentID: data,
                buttonState: 'normal'
            })
        }
    }

    handleTransaction = async () => {
        // var transactionMessage;
        // db.collection("Books").doc(this.state.scannedBookID).get()
        //     .then((doc) => {
        //         var book = doc.data()
        //         if (book.bookAvailability) {
        //             transactionMessage = "Book Issued"
        //             this.intiateBookIssue()
        //             if (Platform.OS == 'android') {
        //                 ToastAndroid.show(transactionMessage, ToastAndroid.SHORT)
        //             }
        //             else {
        //                 Alert.alert("Book Issued")
        //             }
        //         }
        //         else {
        //             transactionMessage = "Book Returned"
        //             this.intiateBookReturn()
        //             if (Platform.OS == 'android') {
        //                 ToastAndroid.show(transactionMessage, ToastAndroid.SHORT)
        //             }
        //             else {
        //                 Alert.alert("Book Returned")
        //             }


        //         }
        //         this.setState({
        //             transactionMessage: transactionMessage,
        //         })
        //     })
        var transactionType = await this.checkBookEligibility()

        if (!transactionType) {
            Alert.alert("This book doesn't exist in the library")
            this.setState({
                scannedStudentID:"",
                scannedBookID:""
            })
        } else if (transactionType === "Issue") {
            var isStudentEligible = await this.checkStudentEligibilityForBookIssue()
            if (isStudentEligible) {
                this.intiateBookIssue()
                Alert.alert("Book is Issued")
            } else {
                var isStudentEligible = await this.checkStudentEligibilityForBookReturn()
            if (isStudentEligible) {
                this.intiateBookReturn()
                Alert.alert("Book is Returned")
            }
        }
    }
}

    checkBookEligibility = async () => {
        const bookRef = await db
            .collection("Books")
            .where("bookID","==", this.state.scannedBookID)
            .get()

            var transactionType = ""
            if(bookRef.docs.length == 0) {
                transactionType = false;
            } else {
                bookRef.docs.map(doc =>{
                    var book = doc.data();
                    if(book.bookAvailability){
                        transactionType = "Issue"
                    } else{
                        transactionType = "Return"
                    }
                })
            }
            return transactionType;
    }

    checkStudentEligibilityForBookIssue = async () => {
        const studentRef = await db
        .collection("Students")
        .where("studentID","==", this.state.scannedStudentID)
        .get()

        var isStudentEligible = "";
        if(studentRef.docs.length == 0) {
            this.setState({
                scannedBookID: "",
                scannedStudentID: ""
            })
            isStudentEligible = false;
            Alert.alert("The Student ID doesn't exist")
        } else {
            studentRef.docs.map(doc =>{
                var student = doc.data()
                if (student.numberBooksIssued < 2) {
                    isStudentEligible = true
                } else {
                    isStudentEligible = false
                    Alert.alert("This student has issued 2 books")
                    this.setState({
                        scannedStudentID:"",
                        scannedBookID:""
                    })
                }
            })
        }
        return isStudentEligible;
    }

    checkStudentEligibilityForBookReturn = async () => {
        const transactionRef = await db
        .collection("Transaction")
        .where("bookID","==", this.state.scannedBookID)
        .limit(1)
        .get()

        var isStudentEligible = "";
        if(bookRef.docs.length == 0) {
            this.setState({
                scannedBookID: "",
                scannedStudentID: ""
            })
            isStudentEligible = false;
            Alert.alert("There is no transcation for the book")
        } else {
            transactionRef.docs.map(doc =>{
                var lastTransaction = doc.data()
                if (lastTransaction.studentID == this.state.scannedStudentID) {
                    isStudentEligible = true
                } else {
                    isStudentEligible = false
                    Alert.alert("This book wasn't issued by the student")
                    this.setState({
                        scannedStudentID:"",
                        scannedBookID:""
                    })
                }
            })
        }
        return isStudentEligible;
    }

    intiateBookIssue = async () => {
        db.collection("Transaction").add({
            'studentID': this.state.scannedStudentID,
            'bookID': this.state.scannedBookID,
            'date': firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "BookIssue"
        })
        db.collection("Books").doc(this.state.scannedBookID).update({
            'bookAvailability': false
        })
        db.collection("Students").doc(this.state.scannedStudentID).update({
            'numberBooksIssued': firebase.firestore.FieldValue.increment(1)
        })
        this.setState({
            scannedStudentID:"",
            scannedBookID:""
        })
    }

    intiateBookReturn = async () => {
        db.collection("Transaction").add({
            'studentID': this.state.scannedStudentID,
            'bookID': this.state.scannedBookID,
            'date': firebase.firestore.Timestamp.now().toDate(),
            'transactionType': "Book Return"
        })
        db.collection("Books").doc(this.state.scannedBookID).update({
            'bookAvailability': true
        })
        db.collection("Students").doc(this.state.scannedStudentID).update({
            'numberBooksIssued': firebase.firestore.FieldValue.increment(-1)
        })
        this.setState({
            scannedStudentID:"",
            scannedBookID:""
        })
    }

    render() {
        const hasCameraPermissions = this.state.hasCameraPermissions
        const scanned = this.state.scanned
        const buttonState = this.state.buttonState
        if (buttonState !== 'normal' && hasCameraPermissions) {
            return (
                <BarCodeScanner
                    style={StyleSheet.absoluteFillObject}
                    onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
                />
            )
        }
        else if (buttonState === 'normal') {
            return (
                <KeyboardAvoidingView behavior="padding" enabled style={styles.container}>
                    <View>
                        <Image
                            source={require('../assets/booklogo.jpg')}
                            style={{ width: 200, height: 200 }}
                        />
                        <Text style={{ textAlign: 'center', fontSize: 30 }}>
                            Library App
                        </Text>
                    </View>
                    <View style={styles.inputView}>
                        <TextInput
                            style={styles.inputBox}
                            placeholder='Student ID'
                            value={this.state.scannedStudentID}
                            onChangeText={(text) => this.setState({
                                scannedStudentID: text
                            })}
                        />
                        <TouchableOpacity style={styles.scanButton} onPress={() => { this.getCameraPermission("StudentID") }}>
                            <Text style={styles.buttonText}> Scan </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputView}>
                        <TextInput
                            style={styles.inputBox}
                            placeholder='Book ID'
                            value={this.state.scannedBookID}
                            onChangeText={(text) => this.setState({
                                scannedBookID: text
                            })}
                        />
                        <TouchableOpacity style={styles.scanButton} onPress={() => { this.getCameraPermission("BookID") }}>
                            <Text style={styles.buttonText}> Scan </Text>
                        </TouchableOpacity>
                    </View>
                    <View>
                        <Text>{this.transactionMessage}</Text>
                        <TouchableOpacity style={styles.submitButton} onPress={async () => { await this.handleTransaction() }}>
                            <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            );
        }
    }
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    displayText: { fontSize: 15, textDecorationLine: 'underline' },
    scanButton: { backgroundColor: '#2196F3', padding: 10, margin: 10 },
    buttonText: { fontSize: 15, textAlign: 'center', marginTop: 10 },
    inputView: { flexDirection: 'row', margin: 20 },
    inputBox: { width: 200, height: 40, borderWidth: 1.5, borderRightWidth: 0, fontSize: 20 },
    scanButton: { backgroundColor: '#66BB6A', width: 50, borderWidth: 1.5, borderLeftWidth: 0 },
    submitButtonText: { padding: 10, textAlign: 'center', fontSize: 20, fontWeight: "bold", color: 'white' },
    submitButton: { backgroundColor: '#FBC02D', width: 100, height: 50 },
});
