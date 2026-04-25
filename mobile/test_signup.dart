import 'package:dio/dio.dart';

void main() async {
  try {
    final dio = Dio(
      BaseOptions(
        validateStatus: (status) => status != null && status >= 200 && status < 500,
      )
    );
    final response = await dio.post(
      'http://localhost:5000/api/auth/sign-up/email',
      data: {
        'name': 'test7',
        'email': 'test7@example.com',
        'password': 'Password123!',
        'rememberMe': true,
        'role': 'CUSTOMER',
      },
    );
    print('Success: ${response.statusCode}');
    print('Data: ${response.data}');
  } catch (e, stack) {
    print('Error: $e');
    print(stack);
  }
}
