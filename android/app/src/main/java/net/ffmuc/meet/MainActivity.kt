package net.ffmuc.meet

import android.content.res.Configuration
import android.os.Bundle
import androidx.core.content.ContextCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "FreifunkMeet"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    applySystemBars(resources.configuration)
  }

  // uiMode is in configChanges: the activity stays, so update the bars here.
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    applySystemBars(newConfig)
  }

  @Suppress("DEPRECATION")
  private fun applySystemBars(config: Configuration) {
    val night =
        (config.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
    val background =
        ContextCompat.getColor(
            createConfigurationContext(config), R.color.ffmuc_background)
    window.setBackgroundDrawable(android.graphics.drawable.ColorDrawable(background))
    window.statusBarColor = background
    window.navigationBarColor = background
    WindowInsetsControllerCompat(window, window.decorView).apply {
      isAppearanceLightStatusBars = !night
      isAppearanceLightNavigationBars = !night
    }
  }
}
