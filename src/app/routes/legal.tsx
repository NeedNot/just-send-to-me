import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/legal')({
  head: () => ({
    meta: seo({
      title: 'Legal - JustSendToMe',
      description: 'Terms of Service and Privacy Policy',
    }),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="bg-secondary/30 mx-auto max-w-4xl space-y-8 p-12 [&_:is(ul)]:list-inside [&_:is(ul)]:list-disc [&_:is(ul)]:space-y-2">
      <h1 className="text-3xl font-semibold">
        JustSendToMe Terms of Service and Privacy Policy
      </h1>
      <h4 className="text-muted-foreground">
        Last updated and effective: 16 Nov 2025
      </h4>
      <h2 id="tos" className="text-2xl font-semibold">
        Terms of Service
      </h2>
      <p>
        This service (“Service”) lets users create temporary request folders
        that other people can upload files into.
      </p>
      <p>By using the Service, you agree to the following:</p>
      <h3 className="text-xl font-semibold">1. Accounts and Credits</h3>
      <ul>
        <li>You may sign up for a free or paid account.</li>
        <li>
          Accounts receive credits. Creating a request folder costs credits
          based on how long the folder will stay active.
        </li>
        <li>
          <p>Credits automatically return 30 days after they were used.</p>
          <p>
            Example: If you spend 1 credit today, you get 1 credit back 30 days
            from now.
          </p>
        </li>
        <li>
          Spending credits on different days results in each credit returning 30
          days after its own use.
        </li>
      </ul>
      <h3 className="text-xl font-semibold">2. Request Folders</h3>
      <ul>
        <li>
          Each folder has:
          <ul>
            <li>A maximum number of files allowed</li>
            <li>A maximum total size</li>
            <li>A fixed expiration time set when created</li>
          </ul>
        </li>
        <li>
          Anyone with the shareable link may upload files. They do not need an
          account.
        </li>
        <li>Files and folders cannot be manually deleted by users.</li>
        <li>
          <p>
            When a folder expires, all files in it <em>should</em> be removed at
            the same time.
          </p>
          <p>
            If files are not removed immediately due to a technical bug, they
            will be deleted within 30 days .
          </p>
        </li>
      </ul>
      <h3 className="text-xl font-semibold">
        3. Data Removal and Service Control
      </h3>
      <ul>
        <li>
          We reserve the right to remove any file, folder, or account at our
          sole discretion.
        </li>
        <li>We may modify, suspend, or terminate the Service at any time.</li>
      </ul>
      <h3 className="text-xl font-semibold">4. Account Deletion</h3>
      <ul>
        <li>
          Once you start the deletion process your account is deactivated for 30
          days. If you do not deactivate your account during the 30 days your
          account will be fully deleted.
        </li>
        <li>
          Deleting an account deletes all folders, account info, subscription
          data and anything else related to the account.
        </li>
      </ul>
      <h3 className="text-xl font-semibold">5. Subscriptions</h3>
      <ul>
        <li>Subscriptions are non-refundable.</li>
        <li>
          You may downgrade to a cheaper plan; unused value will be applied as
          extra time or credits on the lower-priced plan.
        </li>
        <li>Upgrades take effect immediately.</li>
      </ul>
      <h3 className="text-xl font-semibold">6. User Responsibilities</h3>
      <p>You agree not to upload or share:</p>
      <ul>
        <li>Illegal content</li>
        <li>Harmful, abusive, or malicious content</li>
        <li>Copyrighted material without permission</li>
        <li>Any content that violates applicable laws</li>
      </ul>
      <p>
        You are responsible for the content you upload, even if uploaded through
        your someone else’s shareable link.
      </p>
      <h3 className="text-xl font-semibold">7. Service Provided “As Is”</h3>
      <p>The Service is provided without warranties or guarantees.</p>
      <p>We are not liable for:</p>
      <ul>
        <li>Lost files</li>
        <li>Accidental deletion</li>
        <li>Downtime</li>
        <li>Data corruption</li>
        <li>Any damages caused by use or misuse of the Service</li>
      </ul>
      <h3 className="text-xl font-semibold">8. Contact</h3>
      <p>Questions? Email: contact@justsendto.me</p>
      <h3 className="text-xl font-semibold">9. Changes to These Terms</h3>
      <p>We may update these Terms at any time.</p>
      <p>
        When we do, we will change the “Last updated” date at the top of this
        page.
      </p>
      <p>
        If you continue using the Service after the changes take effect, you
        agree to the updated Terms.
      </p>
      <p>If you do not agree, you must stop using the Service.</p>
      <h2 id="privacy" className="text-2xl font-semibold">
        Privacy policy
      </h2>
      <h4 className="text-muted-foreground">Last updated: 16 Nov 2025</h4>
      <h3 className="text-xl font-semibold">1. What Data We Collect</h3>
      <p>We collect only the information necessary to operate the Service:</p>
      <ul>
        <li>
          Account information (name, email, password hash, subscription details)
        </li>
        <li>Usage data (credits used, folder metadata, expiration times)</li>
        <li>Uploaded files (stored only until expiration)</li>
        <li>IP addresses and basic logs for security and abuse prevention</li>
      </ul>
      <h3 className="text-xl font-semibold">2. How We Use Your Data</h3>
      <p>We use your data to:</p>
      <ul>
        <li>Operate the Service</li>
        <li>Create and manage request folders</li>
        <li>Process file uploads</li>
        <li>Track credits and subscriptions</li>
        <li>Prevent abuse and fraud</li>
        <li>Maintain system stability and security</li>
        <li>Provide support if you contact us</li>
      </ul>
      <h3 className="text-xl font-semibold">3. Who Can Upload Files</h3>
      <p>Anyone with a folder’s shareable link may upload files.</p>
      <p>
        Uploads from non-account users are stored the same way but are not
        associated with personal information.
      </p>
      <h3 className="text-xl font-semibold">4. Data Sharing</h3>
      <p>We do not sell your data.</p>
      <p>
        We may share data only with service providers needed to run the Service
        (e.g., cloud storage, payment processors).
      </p>
      <p>
        These providers only receive the minimum data required for their
        function.
      </p>
      <h3 className="text-xl font-semibold">5. Data Retention</h3>
      <ul>
        <li>
          Files are kept until the folder expires, then deleted within 30 days.
        </li>
        <li>
          Account data is deleted within 30 days after you request account
          deletion.
        </li>
        <li>Logs may be retained for security and system integrity.</li>
      </ul>
      <h3 className="text-xl font-semibold">6. Your Rights</h3>
      <p>You may:</p>
      <ul>
        <li>Request account deletion</li>
        <li>Ask about what data we store</li>
        <li>Contact us with any privacy questions</li>
      </ul>
      <h3 className="text-xl font-semibold">7. Security</h3>
      <p>We take reasonable measures to protect your data.</p>
      <p>
        No online service is perfectly secure, and we cannot guarantee absolute
        security.
      </p>
      <h3 className="text-xl font-semibold">Cookies</h3>
      <p>We use a single essential cookie to maintain your login session.</p>
      <p>
        This cookie is required for the Service to function and is not used for
        tracking, analytics, or advertising.
      </p>
      <h3 className="text-xl font-semibold">8. Contact</h3>
      <p>For any questions or privacy requests:</p>
      <p>contact@justsendto.me</p>
    </div>
  );
}
