import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:html' as html;

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sistema de Senhas Mobile',
      theme: ThemeData(
        primaryColor: const Color(0xFF0F1A52),
        scaffoldBackgroundColor: const Color(0xFFF0F3FC),
        colorScheme: ColorScheme.fromSwatch().copyWith(
          primary: const Color(0xFF0F1A52),
          secondary: const Color(0xFF8F9AD2),
        ),
      ),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final String apiBaseUrl = 'http://localhost';
  late IO.Socket socket;

  bool isLoggedIn = false;
  bool isGoogleUser = false;
  Map<String, dynamic>? user;
  String? token;

  String tipoSelecionado = 'normal';
  Map<String, dynamic>? senhaAtiva;
  bool carregando = false;
  bool carregandoLogin = false;
  bool senhaFinalizada = false;
  String erro = '';
  String deviceId = 'mobile-device-id-12345';

  @override
  void initState() {
    super.initState();
    initSocket();
    processarUrlCallbackGoogle();
    verificarMinhaSenha();
  }

  void initSocket() {
    socket = IO.io(apiBaseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket.connect();

    socket.onConnect((_) {
      print('Socket conectado!');
      socket.emit('register-device', {'deviceId': deviceId, 'role': 'ticket'});
    });

    socket.on('queue-updated', (_) => verificarMinhaSenha(silent: true));
    socket.on('your-turn', (data) => handleSenhaUpdate(data));
    socket.on('ticket-called', (data) => handleSenhaUpdate(data));
    socket.on('attendance-finished', (_) => handleSenhaFinalizada());
    socket.on('ticket-cancelled', (_) => handleSenhaFinalizada());
  }

  void processarUrlCallbackGoogle() {
    try {
      final uri = Uri.parse(html.window.location.href);
      final queryToken = uri.queryParameters['token'];
      final queryUser = uri.queryParameters['user'];
      
      if (queryToken != null && queryUser != null) {
        final userData = json.decode(Uri.decodeComponent(queryUser));
        setState(() {
          token = queryToken;
          user = userData;
          isLoggedIn = true;
          isGoogleUser = true;
        });
        html.window.history.replaceState({}, '', uri.path);
      }
    } catch (e) {
      print('Ambiente não-web ou erro ao processar callback: $e');
    }
  }

  void loginComGoogle() {
    setState(() {
      carregandoLogin = true;
    });
    try {
      final googleAuthUrl = senhaAtiva != null 
          ? '$apiBaseUrl/auth/google?senha=${Uri.encodeComponent(json.encode(senhaAtiva))}'
          : '$apiBaseUrl/auth/google';
      html.window.location.href = googleAuthUrl;
    } catch (e) {
      setState(() {
        erro = 'Erro ao redirecionar para o Google Login.';
        carregandoLogin = false;
      });
    }
  }

  void logout() {
    setState(() {
      isLoggedIn = false;
      isGoogleUser = false;
      user = null;
      token = null;
      senhaAtiva = null;
    });
  }

  void handleSenhaUpdate(dynamic data) {
    if (data != null && data['senha'] != null) {
      final s = data['senha'];
      if (s['dispositivo_id'] == deviceId || (senhaAtiva != null && s['numero'] == senhaAtiva!['numero'])) {
        setState(() {
          senhaAtiva = s;
        });
      }
    }
    verificarMinhaSenha(silent: true);
  }

  void handleSenhaFinalizada() {
    setState(() {
      senhaFinalizada = true;
      senhaAtiva = null;
    });
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() {
          senhaFinalizada = false;
        });
      }
    });
  }

  Future<void> verificarMinhaSenha({bool silent = false}) async {
    if (!silent) {
      setState(() {
        carregando = true;
        erro = '';
      });
    }
    try {
      final url = isLoggedIn 
          ? '$apiBaseUrl/api/minha-senha' 
          : '$apiBaseUrl/api/minha-senha/publica?deviceId=$deviceId';
          
      final headers = <String, String>{};
      if (isLoggedIn && token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.get(Uri.parse(url), headers: headers);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data != null && data['mensagem'] == 'Nenhuma senha ativa encontrada') {
          if (senhaAtiva != null) {
            handleSenhaFinalizada();
          }
        } else if (data != null && data['numero'] != null) {
          setState(() {
            senhaAtiva = data;
          });
        }
      }
    } catch (e) {
      print('Erro ao carregar senha ativa: $e');
    } finally {
      if (!silent && mounted) {
        setState(() {
          carregando = false;
        });
      }
    }
  }

  Future<void> retirarSenha() async {
    setState(() {
      carregando = true;
      erro = '';
    });
    try {
      final url = isLoggedIn ? '$apiBaseUrl/api/senha' : '$apiBaseUrl/api/senha/publica';
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (isLoggedIn && token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.post(
        Uri.parse(url),
        headers: headers,
        body: json.encode(isLoggedIn 
            ? {'tipo': tipoSelecionado} 
            : {'tipo': tipoSelecionado, 'deviceId': deviceId}
        ),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          senhaAtiva = data;
          senhaFinalizada = false;
        });
      } else {
        final data = json.decode(response.body);
        setState(() {
          erro = data['erro'] ?? 'Erro ao retirar senha.';
        });
      }
    } catch (e) {
      setState(() {
        erro = 'Não foi possível conectar ao servidor.';
      });
    } finally {
      if (mounted) {
        setState(() {
          carregando = false;
        });
      }
    }
  }

  Future<void> cancelarSenha() async {
    setState(() {
      carregando = true;
    });
    try {
      if (isLoggedIn) {
        await http.put(
          Uri.parse('$apiBaseUrl/api/minha-senha/cancelar'),
          headers: {'Authorization': 'Bearer $token'},
        );
      } else {
        await http.put(
          Uri.parse('$apiBaseUrl/api/minha-senha/cancelar/publica'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'deviceId': deviceId}),
        );
      }
      handleSenhaFinalizada();
    } catch (e) {
      print('Erro ao cancelar senha: $e');
    } finally {
      if (mounted) {
        setState(() {
          carregando = false;
        });
      }
    }
  }

  @override
  void dispose() {
    socket.disconnect();
    socket.dispose();
    super.dispose();
  }

  // Método para calcular tamanhos responsivos
  double _getResponsiveSize(BuildContext context, double baseSize) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    final shortestSide = screenWidth < screenHeight ? screenWidth : screenHeight;
    
    // Ajusta baseado no tamanho da tela
    if (shortestSide < 360) {
      return baseSize * 0.7; // Telas muito pequenas
    } else if (shortestSide < 400) {
      return baseSize * 0.8; // Telas pequenas
    } else if (shortestSide < 600) {
      return baseSize; // Tamanho base (mobile)
    } else {
      return baseSize * 1.2; // Telas maiores (tablet)
    }
  }

  double _getResponsivePadding(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    if (screenWidth < 360) return 12.0;
    if (screenWidth < 400) return 16.0;
    if (screenWidth < 600) return 24.0;
    return 32.0;
  }

  @override
  Widget build(BuildContext context) {
    final horizontalPadding = _getResponsivePadding(context);
    final cardPadding = _getResponsiveSize(context, 24);
    
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            colors: [Color(0xFFF0F3FC), Color(0xFF8F9AD2)],
            center: Alignment.center,
            radius: 1.0,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 16),
              child: Card(
                elevation: 12,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                color: const Color(0xFFF0F3FC),
                child: Padding(
                  padding: EdgeInsets.all(cardPadding),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Cabeçalho do Perfil / Login
                      if (isLoggedIn && user != null) ...[
                        _buildUserProfile(context),
                        SizedBox(height: _getResponsiveSize(context, 16)),
                      ] else ...[
                        _buildLoginHeader(context),
                      ],

                      // Conteúdo principal
                      if (senhaFinalizada) ...[
                        _buildFinalizadoSection(context),
                      ] else if (senhaAtiva != null) ...[
                        _buildSenhaAtivaSection(context),
                      ] else ...[
                        _buildRetirarSenhaSection(context),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUserProfile(BuildContext context) {
    final avatarSize = _getResponsiveSize(context, 32);
    final nameSize = _getResponsiveSize(context, 14);
    final subtitleSize = _getResponsiveSize(context, 11);
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Row(
            children: [
              CircleAvatar(
                radius: avatarSize,
                backgroundImage: user!['foto'] != null ? NetworkImage(user!['foto']) : null,
                backgroundColor: const Color(0xFF8F9AD2),
                child: user!['foto'] == null 
                    ? Icon(Icons.person, color: Colors.white, size: avatarSize) 
                    : null,
              ),
              SizedBox(width: _getResponsiveSize(context, 8)),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Olá, ${user!['nome']?.split(' ')[0] ?? 'Usuário'}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold, 
                        fontSize: nameSize,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      'Retire sua senha', 
                      style: TextStyle(
                        color: Colors.black54, 
                        fontSize: subtitleSize,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        SizedBox(width: 8),
        ElevatedButton(
          onPressed: logout,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0F1A52),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            padding: EdgeInsets.symmetric(
              horizontal: _getResponsiveSize(context, 12), 
              vertical: _getResponsiveSize(context, 8),
            ),
          ),
          child: Text(
            'Sair', 
            style: TextStyle(
              color: Colors.white, 
              fontSize: _getResponsiveSize(context, 12),
            ),
          ),
        )
      ],
    );
  }

  Widget _buildLoginHeader(BuildContext context) {
    final titleSize = _getResponsiveSize(context, 22);
    final subtitleSize = _getResponsiveSize(context, 13);
    final buttonTextSize = _getResponsiveSize(context, 14);
    final buttonIconSize = _getResponsiveSize(context, 18);
    final spacing = _getResponsiveSize(context, 16);
    
    return Column(
      children: [
        Text(
          'Retirada de Senhas',
          style: TextStyle(
            fontSize: titleSize,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 4),
        Text(
          'Sistema de Atendimento Online',
          style: TextStyle(
            fontSize: subtitleSize,
            color: Colors.black54,
          ),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: spacing),

        // Botão de login com Google
        if (!senhaFinalizada && senhaAtiva == null) ...[
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: carregandoLogin ? null : loginComGoogle,
              style: OutlinedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: _getResponsiveSize(context, 12)),
                side: const BorderSide(color: Colors.black12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
                backgroundColor: Colors.white,
                elevation: 2,
              ),
              icon: carregandoLogin 
                  ? SizedBox(
                      width: buttonIconSize, 
                      height: buttonIconSize, 
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Image.network(
                      'https://www.google.com/favicon.ico', 
                      width: buttonIconSize, 
                      height: buttonIconSize,
                    ),
              label: Text(
                'Entrar com o Google',
                style: TextStyle(
                  color: Colors.black, 
                  fontWeight: FontWeight.w500, 
                  fontSize: buttonTextSize,
                ),
              ),
            ),
          ),
          SizedBox(height: spacing * 0.75),
          Row(
            children: [
              const Expanded(child: Divider(color: Colors.black12)),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: spacing * 0.5),
                child: Text(
                  'ou', 
                  style: TextStyle(
                    color: Colors.black45, 
                    fontSize: subtitleSize,
                  ),
                ),
              ),
              const Expanded(child: Divider(color: Colors.black12)),
            ],
          ),
          SizedBox(height: spacing),
        ],
      ],
    );
  }

  Widget _buildFinalizadoSection(BuildContext context) {
    final iconSize = _getResponsiveSize(context, 60);
    final titleSize = _getResponsiveSize(context, 18);
    final textSize = _getResponsiveSize(context, 13);
    
    return Column(
      children: [
        Icon(
          Icons.check_circle_outline,
          color: const Color(0xFF2B387E),
          size: iconSize,
        ),
        SizedBox(height: _getResponsiveSize(context, 12)),
        Text(
          'Atendimento Finalizado!',
          style: TextStyle(
            fontSize: titleSize,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF2B387E),
          ),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 8),
        Text(
          'Seu atendimento foi concluído com sucesso.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.black54, 
            fontSize: textSize,
          ),
        ),
        SizedBox(height: _getResponsiveSize(context, 16)),
        ElevatedButton(
          onPressed: () {
            setState(() {
              senhaFinalizada = false;
            });
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0F1A52),
            padding: EdgeInsets.symmetric(
              horizontal: _getResponsiveSize(context, 24), 
              vertical: _getResponsiveSize(context, 12),
            ),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          child: Text(
            'Retirar Nova Senha', 
            style: TextStyle(
              color: Colors.white, 
              fontSize: textSize,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSenhaAtivaSection(BuildContext context) {
    final labelSize = _getResponsiveSize(context, 12);
    final numeroSize = _getResponsiveSize(context, 48);
    final chipTextSize = _getResponsiveSize(context, 12);
    final infoTextSize = _getResponsiveSize(context, 13);
    final codigoSize = _getResponsiveSize(context, 18);
    final spacing = _getResponsiveSize(context, 12);
    
    return Column(
      children: [
        Text(
          'Sua senha',
          style: TextStyle(
            fontSize: labelSize, 
            letterSpacing: 2, 
            color: Colors.black54,
          ),
        ),
        SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: EdgeInsets.all(_getResponsiveSize(context, 16)),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFCCD4FF), Color(0xFF949FD4)],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Center(
            child: Text(
              senhaAtiva!['numero'] ?? '',
              style: TextStyle(
                fontSize: numeroSize,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF0F1A52),
              ),
            ),
          ),
        ),
        SizedBox(height: spacing),
        Chip(
          backgroundColor: const Color(0xFFCCD4FF),
          label: Text(
            senhaAtiva!['tipo'] == 'prioritario' ? '⭐ Prioritário' : '👤 Normal',
            style: TextStyle(
              color: const Color(0xFF0F1A52), 
              fontWeight: FontWeight.bold,
              fontSize: chipTextSize,
            ),
          ),
        ),
        SizedBox(height: spacing),

        // Status chamando
        if (senhaAtiva!['status'] == 'chamando') ...[
          Container(
            padding: EdgeInsets.all(_getResponsiveSize(context, 12)),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF7E0),
              border: Border.all(color: const Color(0xFFF59E0B), width: 2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Text('📢 ', style: TextStyle(fontSize: infoTextSize)),
                Expanded(
                  child: Text(
                    'Sua senha está sendo chamada! Dirija-se ao ${senhaAtiva!['guiche'] ?? 'guichê indicado'}.',
                    style: TextStyle(
                      color: const Color(0xFF8A6B1E), 
                      fontWeight: FontWeight.bold,
                      fontSize: infoTextSize,
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: spacing),
        ],

        // Card previsão
        Container(
          padding: EdgeInsets.all(_getResponsiveSize(context, 12)),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFCCD4FF), Color(0xFF949FD4)],
            ),
            border: Border.all(color: const Color(0xFF6B78C7), width: 2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Text('👥 ', style: TextStyle(fontSize: infoTextSize)),
                  Text(
                    '${senhaAtiva!['pessoasNaFrente'] ?? 0} senha(s) na frente',
                    style: TextStyle(
                      color: const Color(0xFF0F1A52), 
                      fontSize: infoTextSize,
                    ),
                  ),
                ],
              ),
              const Divider(color: Colors.black12),
              Row(
                children: [
                  Text('⏱️ ', style: TextStyle(fontSize: infoTextSize)),
                  Text(
                    'Tempo estimado: ${senhaAtiva!['tempoEstimadoMinutos'] ?? 0} min',
                    style: TextStyle(
                      color: const Color(0xFF0F1A52), 
                      fontSize: infoTextSize,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        SizedBox(height: spacing),

        // Código verificação
        Container(
          width: double.infinity,
          padding: EdgeInsets.all(_getResponsiveSize(context, 12)),
          decoration: BoxDecoration(
            color: const Color(0xFFCCD4FF),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Text(
                'CÓDIGO DE VERIFICAÇÃO', 
                style: TextStyle(
                  fontSize: labelSize * 0.9, 
                  fontWeight: FontWeight.bold, 
                  color: const Color(0xFF0F1A52),
                ),
              ),
              SizedBox(height: 6),
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: _getResponsiveSize(context, 12), 
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  senhaAtiva!['codigo_verificacao'] ?? '',
                  style: TextStyle(
                    fontSize: codigoSize, 
                    fontWeight: FontWeight.bold, 
                    letterSpacing: 2, 
                    color: const Color(0xFF0F1A52),
                  ),
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: spacing),

        // Botão cancelar
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: cancelarSenha,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE93A32),
              padding: EdgeInsets.symmetric(vertical: _getResponsiveSize(context, 12)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(
              '✗ Cancelar Senha', 
              style: TextStyle(
                color: Colors.white, 
                fontWeight: FontWeight.bold,
                fontSize: infoTextSize,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRetirarSenhaSection(BuildContext context) {
    final titleSize = _getResponsiveSize(context, 14);
    final cardIconSize = _getResponsiveSize(context, 24);
    final cardTitleSize = _getResponsiveSize(context, 13);
    final cardDescSize = _getResponsiveSize(context, 10);
    final buttonTextSize = _getResponsiveSize(context, 14);
    final cardHeight = _getResponsiveSize(context, 120);
    final spacing = _getResponsiveSize(context, 12);
    
    return Column(
      children: [
        Text(
          'Escolha o tipo de atendimento:',
          style: TextStyle(
            fontSize: titleSize, 
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: spacing),

        // Cards de Tipo - Layout responsivo
        LayoutBuilder(
          builder: (context, constraints) {
            // Em telas muito pequenas, empilha verticalmente
            if (constraints.maxWidth < 300) {
              return Column(
                children: [
                  _buildTipoCard(
                    context, 
                    'prioritario', 
                    '♿', 
                    'Preferencial', 
                    'Fila prioritária',
                    cardHeight,
                    cardIconSize,
                    cardTitleSize,
                    cardDescSize,
                  ),
                  SizedBox(height: 8),
                  _buildTipoCard(
                    context, 
                    'normal', 
                    '👤', 
                    'Normal', 
                    'Fila padrão',
                    cardHeight,
                    cardIconSize,
                    cardTitleSize,
                    cardDescSize,
                  ),
                ],
              );
            }
            
            // Layout horizontal para telas maiores
            return Row(
              children: [
                Expanded(
                  child: _buildTipoCard(
                    context, 
                    'prioritario', 
                    '♿', 
                    'Preferencial', 
                    'Fila prioritária',
                    cardHeight,
                    cardIconSize,
                    cardTitleSize,
                    cardDescSize,
                  ),
                ),
                SizedBox(width: spacing),
                Expanded(
                  child: _buildTipoCard(
                    context, 
                    'normal', 
                    '👤', 
                    'Normal', 
                    'Fila padrão',
                    cardHeight,
                    cardIconSize,
                    cardTitleSize,
                    cardDescSize,
                  ),
                ),
              ],
            );
          },
        ),
        SizedBox(height: spacing),

        if (erro.isNotEmpty) ...[
          Text(
            erro, 
            style: TextStyle(
              color: Colors.red, 
              fontWeight: FontWeight.bold,
              fontSize: cardDescSize,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: spacing),
        ],

        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: retirarSenha,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F1A52),
              padding: EdgeInsets.symmetric(vertical: _getResponsiveSize(context, 14)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: Text(
              '🎟️ Retirar Senha', 
              style: TextStyle(
                color: Colors.white, 
                fontSize: buttonTextSize, 
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTipoCard(
    BuildContext context,
    String tipo,
    String icone,
    String titulo,
    String descricao,
    double height,
    double iconSize,
    double titleSize,
    double descSize,
  ) {
    final isSelected = tipoSelecionado == tipo;
    
    return GestureDetector(
      onTap: () => setState(() => tipoSelecionado = tipo),
      child: Container(
        height: height,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: tipo == 'prioritario'
                ? [const Color(0xFF2B387E), const Color(0xFF8F9AD2)]
                : [const Color(0xFF8F9AD2), const Color(0xFF2B387E)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
          borderRadius: BorderRadius.circular(16),
          border: isSelected ? Border.all(color: Colors.white, width: 3) : null,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 6,
              offset: const Offset(0, 3),
            )
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(icone, style: TextStyle(fontSize: iconSize)),
            SizedBox(height: 4),
            Text(
              titulo, 
              style: TextStyle(
                color: Colors.white, 
                fontWeight: FontWeight.bold, 
                fontSize: titleSize,
              ),
            ),
            Text(
              descricao, 
              style: TextStyle(
                color: Colors.white.withOpacity(0.8), 
                fontSize: descSize,
              ),
            ),
          ],
        ),
      ),
    );
  }
}