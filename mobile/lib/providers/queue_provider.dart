import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

class QueueProvider extends ChangeNotifier {
  final Dio _dio = Dio();
  final String _baseUrl = 'http://localhost:3000/api';

  String? _currentTicket;
  int _position = 0;
  int _estimatedTime = 0;
  bool _isLoading = false;
  String? _error;

  String? get currentTicket => _currentTicket;
  int get position => _position;
  int get estimatedTime => _estimatedTime;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> getTicket(String type, String token) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _dio.post(
        '$_baseUrl/senha',
        data: {'tipo': type},
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 201) {
        _currentTicket = response.data['numero'];
        _position = 0;
        _estimatedTime = 0;
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> getMyTicket(String token) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _dio.get(
        '$_baseUrl/minha-senha',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        _currentTicket = response.data['numero'];
        _position = response.data['pessoasNaFrente'] ?? 0;
        _estimatedTime = response.data['tempoEstimadoMinutos'] ?? 0;
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> cancelTicket(String token) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final response = await _dio.put(
        '$_baseUrl/minha-senha/cancelar',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        _currentTicket = null;
        _position = 0;
        _estimatedTime = 0;
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
