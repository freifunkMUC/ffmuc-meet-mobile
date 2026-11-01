package net.ffmuc.meet.pow

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.security.MessageDigest
import java.util.concurrent.Executors

/**
 * Proof of work for the room reservation service: finds a decimal nonce so
 * that SHA-256(challenge + ":" + nonce) has enough leading zero bits.
 */
class PowModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

  private val executor = Executors.newSingleThreadExecutor()

  override fun getName(): String = NAME

  @ReactMethod
  fun solve(challenge: String, difficulty: Double, start: Double, count: Double, promise: Promise) {
    executor.execute {
      try {
        val found = solveRange(challenge, difficulty.toInt(), start.toLong(), count.toLong())
        promise.resolve(found?.toDouble())
      } catch (e: Exception) {
        promise.reject("pow_error", e)
      }
    }
  }

  override fun invalidate() {
    executor.shutdownNow()
    super.invalidate()
  }

  companion object {
    const val NAME = "FfmucPow"

    fun leadingZeroBits(hash: ByteArray): Int {
      var n = 0
      for (b in hash) {
        val v = b.toInt() and 0xff
        if (v == 0) {
          n += 8
          continue
        }
        return n + Integer.numberOfLeadingZeros(v) - 24
      }
      return n
    }

    fun solveRange(challenge: String, difficulty: Int, start: Long, count: Long): Long? {
      val md = MessageDigest.getInstance("SHA-256")
      val prefix = "$challenge:".toByteArray(Charsets.UTF_8)
      for (n in start until start + count) {
        md.reset()
        md.update(prefix)
        md.update(n.toString().toByteArray(Charsets.US_ASCII))
        if (leadingZeroBits(md.digest()) >= difficulty) {
          return n
        }
      }
      return null
    }
  }
}
