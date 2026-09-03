package in.honeyvision.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity - Entry point for HoneyVision Android application
 * Handles deep links and initializes Capacitor bridge
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Handle deep links from app launch
        Intent intent = getIntent();
        String action = intent.getAction();
        Uri data = intent.getData();
        
        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            String deepLink = data.toString();
            // Pass the deep link to JavaScript via the bridge
            // The JavaScript code will handle navigation
            Bundle initialData = new Bundle();
            initialData.putString("deepLink", deepLink);
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        
        // Handle deep links when app is already running
        String action = intent.getAction();
        Uri data = intent.getData();
        
        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            // Handle the deep link
            String deepLink = data.toString();
            // Pass to JavaScript
        }
    }
}
