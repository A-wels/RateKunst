package de.awels.ratekunst;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Process;

/** Starts a fresh, entitled process after an advertising session has been used. */
public final class AdFreeRestartActivity extends Activity {
  private static final String ORIGINAL_PID = "originalPid";

  public static boolean isRestartProcess(Context context) {
    if (android.os.Build.VERSION.SDK_INT >= 28) {
      return android.app.Application.getProcessName().endsWith(":adfree_restart");
    }
    ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
    if (manager == null || manager.getRunningAppProcesses() == null) return false;
    for (ActivityManager.RunningAppProcessInfo process : manager.getRunningAppProcesses()) {
      if (process.pid == Process.myPid()) return process.processName.endsWith(":adfree_restart");
    }
    return false;
  }

  public static void restart(Activity activity) {
    activity.startActivity(new Intent(activity, AdFreeRestartActivity.class)
        .putExtra(ORIGINAL_PID, Process.myPid())
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK));
  }

  @Override protected void onCreate(Bundle state) {
    super.onCreate(state);
    int originalPid = getIntent().getIntExtra(ORIGINAL_PID, -1);
    if (originalPid > 0 && originalPid != Process.myPid()) Process.killProcess(originalPid);
    Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
    if (launch != null) startActivity(launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK));
    finish();
    Process.killProcess(Process.myPid());
  }
}
