import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthProvider extends ChangeNotifier {
  String? _token;
  String? _userEmail;
  String? _userName;
  bool _isAdmin = false;
  bool _isLoading = false;

  String? get token => _token;
  String? get userEmail => _userEmail;
  String? get userName => _userName;
  bool get isAdmin => _isAdmin;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _token != null;

  final GoogleSignIn _googleSignIn = GoogleSignIn();

  Future<void> loginWithGoogle() async {
    try {
      _isLoading = true;
      notifyListeners();

      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        _isLoading = false;
        notifyListeners();
        return;
      }

      _userEmail = googleUser.email;
      _userName = googleUser.displayName;

      // Aqui você faria a chamada para o backend para obter o token JWT
      // Por enquanto, vamos simular
      _token = 'mock_jwt_token_${DateTime.now().millisecondsSinceEpoch}';

      // Salvar token localmente
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      await prefs.setString('email', _userEmail!);
      await prefs.setString('name', _userName!);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _googleSignIn.signOut();
      _token = null;
      _userEmail = null;
      _userName = null;
      _isAdmin = false;

      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      await prefs.remove('email');
      await prefs.remove('name');

      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> loadStoredToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('token');
      _userEmail = prefs.getString('email');
      _userName = prefs.getString('name');
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }
}
