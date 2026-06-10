import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/queue_provider.dart';

class GetTicketScreen extends StatefulWidget {
  const GetTicketScreen({Key? key}) : super(key: key);

  @override
  State<GetTicketScreen> createState() => _GetTicketScreenState();
}

class _GetTicketScreenState extends State<GetTicketScreen> {
  String _selectedType = 'normal';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Retirar Senha'),
      ),
      body: Consumer2<AuthProvider, QueueProvider>(
        builder: (context, authProvider, queueProvider, _) {
          if (queueProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (queueProvider.currentTicket != null) {
            return _buildSuccessView(context, queueProvider);
          }

          return _buildFormView(context, authProvider, queueProvider);
        },
      ),
    );
  }

  Widget _buildFormView(
    BuildContext context,
    AuthProvider authProvider,
    QueueProvider queueProvider,
  ) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            'Selecione o tipo de atendimento',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 30),
          Card(
            child: RadioListTile<String>(
              title: const Text('Atendimento Normal'),
              subtitle: const Text('Fila padrão'),
              value: 'normal',
              groupValue: _selectedType,
              onChanged: (value) {
                setState(() => _selectedType = value!);
              },
            ),
          ),
          Card(
            child: RadioListTile<String>(
              title: const Text('Atendimento Prioritário'),
              subtitle: const Text('Idosos, gestantes, PCD'),
              value: 'prioritario',
              groupValue: _selectedType,
              onChanged: (value) {
                setState(() => _selectedType = value!);
              },
            ),
          ),
          const SizedBox(height: 30),
          ElevatedButton(
            onPressed: () async {
              try {
                await queueProvider.getTicket(
                  _selectedType,
                  authProvider.token!,
                );
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Erro: $e')),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: 40,
                vertical: 15,
              ),
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            child: const Text('Retirar Senha'),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessView(
    BuildContext context,
    QueueProvider queueProvider,
  ) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle, size: 80, color: Colors.green),
          const SizedBox(height: 20),
          const Text(
            'Senha Retirada com Sucesso!',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.blue, width: 2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              queueProvider.currentTicket!,
              style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () => context.go('/'),
            child: const Text('Voltar ao Início'),
          ),
        ],
      ),
    );
  }
}
