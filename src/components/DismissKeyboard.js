import React from 'react';
import { TouchableWithoutFeedback, Keyboard, View, Platform } from 'react-native';

export default function DismissKeyboard({ children }) {
  if (Platform.OS === 'web') {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableWithoutFeedback>
  );
}
