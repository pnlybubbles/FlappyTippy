(0..9).each { |i|
  l = "http://tippy.gochiusa.net/assets/font_small_#{i}.png"
  puts l
  system("wget #{l}")
}