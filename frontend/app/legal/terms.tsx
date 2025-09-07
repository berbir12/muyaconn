import React from 'react'
import { ScrollView, Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import Colors from '../../constants/Colors'

export default function TermsOfService() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: December 2024</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By accessing or using the SkillHub mobile application and related services, you agree to be bound by these Terms of Service. If you do not agree to these Terms, you may not use the Service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.sectionText}>
            SkillHub is a marketplace platform that connects customers seeking services with skilled taskers who can provide those services. The Service includes job posting, user profiles, messaging, payment processing, and rating systems.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Account Creation:</Text> You must provide accurate information, be at least 18 years old, and maintain account security.
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Account Types:</Text> Customer (post jobs), Tasker (provide services), or Both.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Conduct</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Prohibited Activities:</Text>
          </Text>
          <Text style={styles.sectionText}>
            • Post false or fraudulent information{'\n'}
            • Harass, abuse, or harm other users{'\n'}
            • Post illegal or inappropriate content{'\n'}
            • Violate laws or regulations{'\n'}
            • Attempt to circumvent security{'\n'}
            • Use Service for unauthorized purposes
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Service Provider Responsibilities</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Taskers:</Text> Provide accurate information, complete tasks as agreed, maintain professional conduct, comply with laws.
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Customers:</Text> Provide clear job descriptions, pay for completed services, treat taskers with respect, provide honest feedback.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Payments and Billing</Text>
          <Text style={styles.sectionText}>
            Payments are processed through secure third-party providers. All transactions are subject to our payment terms. We may charge service fees for platform use. Refunds are subject to our refund policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
          <Text style={styles.sectionText}>
            The Service and its content are owned by SkillHub. You may not copy, modify, or distribute our content. You retain ownership of your content but grant us a license to use it for the Service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Privacy and Data Protection</Text>
          <Text style={styles.sectionText}>
            Your privacy is important to us. Please review our Privacy Policy for details on how we collect, use, and protect your information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Service Availability</Text>
          <Text style={styles.sectionText}>
            We strive to maintain service availability but are not liable for temporary interruptions. We may modify or discontinue features with notice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Indemnification</Text>
          <Text style={styles.sectionText}>
            You agree to indemnify and hold harmless SkillHub from any claims arising from your use of the Service, violation of these Terms, or violation of any third-party rights.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Termination</Text>
          <Text style={styles.sectionText}>
            You may terminate your account at any time. We may terminate your account for violations. Termination is effective immediately and you remain liable for outstanding obligations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Dispute Resolution</Text>
          <Text style={styles.sectionText}>
            These Terms are governed by applicable law. Disputes should first be resolved informally by contacting us. If unresolved, disputes may be subject to binding arbitration.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact Information</Text>
          <Text style={styles.sectionText}>
            If you have any questions about these Terms, please contact us:
          </Text>
          <Text style={styles.contactInfo}>
            Email: legal@skillhub.app{'\n'}
            Address: SkillHub Legal Team{'\n'}
            Phone: [Your Contact Number]
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[900],
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.neutral[700],
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
    color: Colors.neutral[900],
  },
  contactInfo: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.neutral[700],
    marginTop: 8,
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: 30,
    marginBottom: 40,
    padding: 20,
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.neutral[600],
    fontStyle: 'italic',
  },
})
