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
import { db } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kullanıcı giriş işlemleri
export const login = createAsyncThunk('user/login', async ({ email, password }) => {
    try {
        const auth = getAuth();
        const userInfos = await signInWithEmailAndPassword(auth, email, password);
        const user = userInfos.user;
        const token = user.stsTokenManager.accessToken;
        const userData = {
            token,
            user: user,
        };
        // AsyncStorage kullanarak kullanıcı bilgilerini cihazda saklama 
        await AsyncStorage.setItem('userToken', token);

        return userData;
    } catch (error) {
        throw error;
    }
});

// Kullanıcı otomatik giriş işlemleri 
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
export const logout = createAsyncThunk('user/logout', async () => {
    try {
        const auth = getAuth();
        await signOut(auth);
        await AsyncStorage.removeItem('userToken');
    } catch (error) {
        throw error;
    }
});

// Kullanıcı Kayıt İşlemleri
export const register = createAsyncThunk('user/register', async ({ email, password, username }) => {
    try {
        const auth = getAuth();
        const userInfos = await createUserWithEmailAndPassword(auth, email, password);
        const user = userInfos.user;
        const token = user.stsTokenManager.accessToken;
        await sendEmailVerification(user);
        await AsyncStorage.setItem('userToken', token);

        // Kullanıcı bilgilerini Firestore'a kaydetme
        const userDoc = doc(db, 'users', user.uid);
        await setDoc(userDoc, {
            informations: {
                name: username,
                email: email,
                interests: [], // Kullanıcı ilgi alanları
                settings: {
                    visibility: 'public', // Profil görünürlüğü: public, private
                    notifications: true // Bildirim ayarları
                }
            },
            friends: [], // Kullanıcının arkadaş listesi
            friendRequests: {
                sent: [], // Gönderilen arkadaşlık istekleri
                received: [] // Alınan arkadaşlık istekleri
            },
            createdAt: new Date(), // Kullanıcı oluşturulma tarihi
        });

        return { token, user: { ...user, username } };
    } catch (error) {
        throw error;
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
                state.error = action.error.message;
            })
            .addCase(autoLogin.pending, (state) => {
                state.loading = true;
                state.isAuth = false;
            })
            .addCase(autoLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuth = true;
                state.token = action.payload;
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
                state.loading = false;
                state.isAuth = false;
                state.token = null;
                state.error = null;
            })
            .addCase(logout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.isAuth = false;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuth = true;
                state.token = action.payload.token;
                state.user = action.payload.user;
            })
            .addCase(register.rejected, (state) => {
                state.loading = false;
                state.isAuth = false;
                state.error = 'Geçersiz E-Posta veya Şifre';
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