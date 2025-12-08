package at.mlamare.paradash;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.community.database.sqlite.CapacitorSQLitePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the SQLite plugin
        registerPlugin(CapacitorSQLitePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
