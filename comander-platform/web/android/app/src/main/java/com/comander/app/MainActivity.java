package com.comander.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Permite que el audio/video del splash se reproduzca automáticamente
    // (sin requerir un gesto del usuario) dentro del WebView del APK.
    this.bridge.getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
  }
}
