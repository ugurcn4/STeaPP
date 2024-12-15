import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

const FriendRequestModal = ({ visible, request, onAccept, onReject, onClose }) => {
    if (!request) return null;

    const handleAccept = async () => {
        await onAccept(request.id);
        onClose();
    };

    const handleReject = async () => {
        await onReject(request.id);
        onClose();
    };

    return (
        <Modal visible={visible} transparent={true} animationType="fade">
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Arkadaşlık İsteği</Text>
                    <Text style={styles.modalText}>
                        {request.senderName} size bir arkadaşlık isteği gönderdi.
                    </Text>
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                            <Text style={styles.buttonText}>Kabul Et</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                            <Text style={styles.buttonText}>Reddet</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.buttonText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: "#fff",
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    acceptButton: {
        backgroundColor: "#28a745",
        borderRadius: 10,
        padding: 10,
        marginRight: 10,
    },
    rejectButton: {
        backgroundColor: "#dc3545",
        borderRadius: 10,
        padding: 10,
    },
    closeButton: {
        backgroundColor: "#6c757d",
        borderRadius: 10,
        padding: 10,
        marginLeft: 10,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});

export default FriendRequestModal;