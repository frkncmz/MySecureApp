# SecureApp 🔐

Şifrelerinizi güvenle saklayabileceğiniz mobil şifre yöneticisi.

## Özellikler

- **PIN Koruması** - 4-6 haneli PIN ile giriş
- **Biyometrik Giriş** - Parmak izi / yüz tanıma desteği
- **Güvenli Depolama** - Veriler cihazda şifreli olarak saklanır
- **Karanlık Mod** - Göz yormayan karanlık tema
- **Kolay Kullanım** - Modern ve kullanıcı dostu arayüz

## Kurulum

```bash
npm install
npx expo start
```

## Teknolojiler

- React Native + Expo
- expo-secure-store (şifreli depolama)
- expo-local-authentication (biyometrik)
- expo-router (navigasyon)

## Güvenlik

Tüm veriler `expo-secure-store` ile cihazda yerel olarak şifrelenir ve saklanır. Hiçbir veri sunucuya gönderilmez.

---

📱 Sadece Android için geliştirilmiştir.
