import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kullanıcı giriş işlemleri
export const login = createAsyncThunk('user/login', async ({ email, password }, { rejectWithValue }) => {
    try {
        const auth = getAuth();

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user) {
            throw new Error('Kullanıcı bilgileri alınamadı');
        }

        const token = await user.getIdToken();

        // Firestore'dan kullanıcı bilgilerini al
        const db = getFirebaseDb();
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            console.error('Firestore kullanıcı dokümanı bulunamadı');
            throw new Error('Kullanıcı bilgileri eksik');
        }

        const userData = userDoc.data();

        const userDataToStore = {
            token,
            user: {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                username: userData.informations?.name || email.split('@')[0]
            }
        };

        // AsyncStorage'a kaydet
        await Promise.all([
            AsyncStorage.setItem('userToken', token),
            AsyncStorage.setItem('userData', JSON.stringify(userDataToStore))
        ]);

        return userDataToStore;
    } catch (error) {
        console.error('Giriş hatası:', error.code, error.message);

        let errorMessage = 'Giriş yapılırken bir hata oluştu';

        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Geçersiz e-posta adresi';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Bu hesap devre dışı bırakılmış';
                break;
            case 'auth/user-not-found':
                errorMessage = 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Hatalı şifre';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin';
                break;
        }

        return rejectWithValue(errorMessage);
    }
});

// Otomatik giriş işlemleri
export const autoLogin = createAsyncThunk('user/autoLogin', async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        if (token) {
            return token;
        } else {
            throw new Error('Kullanıcı Bulunamadı');
        }
    } catch (error) {
        throw error;
    }
});

// Kullanıcı çıkış işlemleri
export const logout = createAsyncThunk('user/logout', async (_, { rejectWithValue }) => {
    try {
        const auth = getAuth();
        await signOut(auth);
        // Tüm local storage verilerini temizle
        await AsyncStorage.multiRemove(['userToken', 'userData']);
        return null;
    } catch (error) {
        console.error('Çıkış hatası:', error);
        return rejectWithValue('Çıkış yapılırken bir hata oluştu');
    }
});

// Kullanıcı Kayıt İşlemleri
export const register = createAsyncThunk('user/register', async ({ email, password, username }, { rejectWithValue }) => {
    try {
        const auth = getAuth();

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user) {
            throw new Error('Kullanıcı oluşturulamadı');
        }

        const token = await user.getIdToken();

        // Kullanıcı bilgilerini Firestore'a kaydetme
        const db = getFirebaseDb();
        const userDoc = doc(db, 'users', user.uid);
        const userData = {
            informations: {
                name: username,
                email: email,
                interests: [],
                settings: {
                    visibility: 'public',
                    notifications: true
                }
            },
            friends: [],
            friendRequests: {
                sent: [],
                received: []
            },
            createdAt: new Date(),
        };

        await setDoc(userDoc, userData);

        // E-posta doğrulama gönder
        await sendEmailVerification(user);

        const userDataToStore = {
            token,
            user: {
                uid: user.uid,
                email: user.email,
                username: username,
                emailVerified: user.emailVerified
            }
        };

        // AsyncStorage'a kaydet
        await Promise.all([
            AsyncStorage.setItem('userToken', token),
            AsyncStorage.setItem('userData', JSON.stringify(userDataToStore))
        ]);

        return userDataToStore;
    } catch (error) {
        console.error('Kayıt hatası:', error.code, error.message);

        let errorMessage = 'Kayıt işlemi sırasında bir hata oluştu';

        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Bu e-posta adresi zaten kullanımda';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Geçersiz e-posta adresi';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'E-posta/şifre girişi devre dışı bırakılmış';
                break;
            case 'auth/weak-password':
                errorMessage = 'Şifre çok zayıf';
                break;
        }

        return rejectWithValue(errorMessage);
    }
});

// Kullanıcı Şifre Sıfırlama İşlemleri
export const sendPasswordResetEmail = createAsyncThunk(
    'user/sendPasswordResetEmail', async (email, { rejectWithValue }) => {
        try {
            const auth = getAuth();
            await firebaseSendPasswordResetEmail(auth, email);
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    isAuth: false,
    user: null,
    loading: false,
    error: null
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuth = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.isAuth = false;
                state.error = action.payload || 'Giriş yapılırken bir hata oluştu';
                state.user = null;
                state.token = null;
            })
            .addCase(autoLogin.pending, (state) => {
                state.loading = true;
                state.isAuth = false;
            })
            .addCase(autoLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuth = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.error = null;
            })
            .addCase(autoLogin.rejected, (state, action) => {
                state.loading = false;
                state.isAuth = false;
                state.error = action.payload;
                state.token = null;
            })
            .addCase(logout.pending, (state) => {
                state.loading = true;
            })
            .addCase(logout.fulfilled, (state) => {
                return { ...initialState };
            })
            .addCase(logout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.isAuth = false;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuth = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.error = null;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.isAuth = false;
                state.user = null;
                state.token = null;
                state.error = action.payload || 'Kayıt işlemi başarısız oldu';
            })
            .addCase(sendPasswordResetEmail.pending, (state) => {
                state.status = 'Yükleniyor';
            })
            .addCase(sendPasswordResetEmail.fulfilled, (state) => {
                state.status = 'Başarılı';
            })
            .addCase(sendPasswordResetEmail.rejected, (state, action) => {
                state.status = 'Hatalı';
                state.error = action.payload;
            });
    }
});

export const { setLoading, setError, clearError } = userSlice.actions;
export default userSlice.reducer;