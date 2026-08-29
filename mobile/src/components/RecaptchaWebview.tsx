/**
 * RecaptchaWebview — reCAPTCHA v2 "I'm not a robot" checkbox widget.
 *
 * Renders the Google reCAPTCHA v2 widget inside a hidden WebView and
 * exposes the resolved token back to the parent via onTokenReady.
 *
 * Usage:
 *   <RecaptchaWebview
 *     siteKey="6Lc..."
 *     onTokenReady={(token) => setRecaptchaToken(token)}
 *     onExpire={() => setRecaptchaToken(null)}
 *   />
 */

import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface RecaptchaWebviewProps {
  siteKey: string;
  onTokenReady?: (token: string) => void;
  onVerify?: (token: string) => void;
  onExpire?: () => void;
  onFailed?: () => void;
  ready?: boolean;
  onReady?: (ready: boolean) => void;
  style?: object;
}

/**
 * Generates the HTML page that loads the reCAPTCHA v2 invisible script,
 * then renders a visible checkbox widget.
 */
function buildRecaptchaHTML(siteKey: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: transparent; }
    .recaptcha-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 0;
    }
    #recaptcha-badge {
      transform-origin: center;
    }
  </style>
</head>
<body>
  <div class="recaptcha-container">
    <div id="recaptcha-badge"></div>
  </div>

  <script src="https://www.google.com/recaptcha/api.js?render=explicit"></script>
  <script>
    function onRecaptchaSuccess(token) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'token', token: token }));
    }

    function onRecaptchaExpired() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expired' }));
    }

    function onRecaptchaFailed() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'failed' }));
    }

    window.onload = function() {
      try {
        grecaptcha.render('recaptcha-badge', {
          sitekey: '${siteKey}',
          callback: onRecaptchaSuccess,
          'expired-callback': onRecaptchaExpired,
          'error-callback': onRecaptchaFailed,
          theme: 'light',
          size: 'normal'
        });
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.toString() }));
      }
    };
  </script>
</body>
</html>`;
}

export default function RecaptchaWebview({
  siteKey,
  onVerify,
  onTokenReady,
  onExpire,
  onFailed,
  onReady,
  style,
}: RecaptchaWebviewProps) {
  const handleToken = onTokenReady ?? onVerify;
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const onMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        switch (data.type) {
          case 'token':
            setLoading(false);
            handleToken?.(data.token);
            break;
          case 'expired':
            setLoading(true);
            onExpire?.();
            break;
          case 'failed':
          case 'error':
            setLoading(true);
            onFailed?.();
            break;
        }
      } catch {
        // Non-JSON message — ignore
      }
    },
    [handleToken, onExpire, onFailed],
  );

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color="#00431D" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: buildRecaptchaHTML(siteKey) }}
        onMessage={onMessage}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        onLoadEnd={() => onReady?.(true)}
        onError={() => {
          setLoading(false);
          onFailed?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 88,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
